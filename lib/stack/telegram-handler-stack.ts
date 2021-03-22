import * as lambda from '@aws-cdk/aws-lambda';
import * as sqs from '@aws-cdk/aws-sqs';
import * as sns from '@aws-cdk/aws-sns';
import * as subscriptions from '@aws-cdk/aws-sns-subscriptions';
import * as iam from '@aws-cdk/aws-iam'
import * as ssm from '@aws-cdk/aws-ssm'
import { Construct, Stack, StackProps } from '@aws-cdk/core';
import { SqsEventSource } from '@aws-cdk/aws-lambda-event-sources';

export class TelegramCommandHandlerStack extends Stack {  
  public readonly pkmnQuizBotCode: lambda.CfnParametersCode;
  
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
        
    this.pkmnQuizBotCode = lambda.Code.fromCfnParameters();
    const pkmnQuizBotLambda = new lambda.Function(this, 'Lambda', {
      functionName: 'PkmnQuizBotLambda',
      runtime: lambda.Runtime.GO_1_X,
      handler: 'lambdaHandler',
      code: this.pkmnQuizBotCode,
    });
    
    const pkmnCommandQueue = new sqs.Queue(this, 'PokemonCommandQueue', {
      queueName: 'pokemon-quiz-command-queue'
    });
    pkmnQuizBotLambda.addEventSource(new SqsEventSource(pkmnCommandQueue))
    
    const commandTopic = new sns.Topic(this, 'TelegramCommandTopic', {
      topicName: "telegram-command-topic"
    })
    commandTopic.addSubscription(new subscriptions.SqsSubscription(pkmnCommandQueue, {
      filterPolicy: {
        "bot": sns.SubscriptionFilter.stringFilter({whitelist: ["pokemon-quiz-bot"]})
      },
      rawMessageDelivery: true
    }))

    new ssm.StringParameter(this, 'commandTopicArn', {
      parameterName: '/telegram/topic/command',
      stringValue: commandTopic.topicArn
    })

    const ssmPolicy = new iam.PolicyStatement()
    ssmPolicy.addActions("ssm:GetParameter", "ssm:GetParametersByPath")
    ssmPolicy.addAllResources()
    pkmnQuizBotLambda.addToRolePolicy(ssmPolicy)

    const commandPublisher = new iam.User(this, 'TelegramCommandPublisher', {
      userName: 'command-publisher'
    })

    commandPublisher.addToPolicy(ssmPolicy)
    commandTopic.grantPublish(commandPublisher)
  }
}
