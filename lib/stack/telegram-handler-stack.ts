import * as lambda from '@aws-cdk/aws-lambda';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
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

    // Lambda definitions

    this.pkmnQuizBotCode = lambda.Code.fromCfnParameters();
    const pkmnQuizBotLambda = new lambda.Function(this, 'Lambda', {
      functionName: 'PkmnQuizBotLambda',
      runtime: lambda.Runtime.GO_1_X,
      handler: 'lambdaHandler',
      code: this.pkmnQuizBotCode,
    });

    // Creating and connecting topic and queues
    
    const pkmnCommandQueue = new sqs.Queue(this, 'PokemonCommandQueue', {
      queueName: 'pokemon-quiz-command-queue'
    });
    pkmnQuizBotLambda.addEventSource(new SqsEventSource(pkmnCommandQueue))
    
    const commandTopic = new sns.Topic(this, 'TelegramCommandTopic', {
      topicName: 'telegram-command-topic'
    })
    commandTopic.addSubscription(new subscriptions.SqsSubscription(pkmnCommandQueue, {
      filterPolicy: {
        'bot': sns.SubscriptionFilter.stringFilter({whitelist: ['pokemon-quiz-bot']})
      },
      rawMessageDelivery: true
    }))

    // Saving our topic ARN to SSM since it's used by an application outside of this CDK stack

    new ssm.StringParameter(this, 'commandTopicArn', {
      parameterName: '/telegram/topic/command',
      stringValue: commandTopic.topicArn
    })

    // DynamoDb

    const chatConfigTable = new dynamodb.Table(this, 'ChatConfig', {
      tableName: 'ChatConfig',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.NUMBER }
    })

    const naviPaymentsTable = new dynamodb.Table(this, 'NaviPayments', {
      tableName: 'NaviPayments',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: {name: 'SK', type: dynamodb.AttributeType.STRING},
    })

    naviPaymentsTable.addGlobalSecondaryIndex({
      indexName: 'status-index',
      partitionKey: {name: 'status', type: dynamodb.AttributeType.STRING},
      sortKey: {name: 'date', type: dynamodb.AttributeType.STRING}
    })

    // Permissions

    const ssmPolicy = new iam.PolicyStatement()
    ssmPolicy.addActions('ssm:GetParameter', 'ssm:GetParametersByPath')
    ssmPolicy.addAllResources()
    pkmnQuizBotLambda.addToRolePolicy(ssmPolicy)
    chatConfigTable.grantReadWriteData(pkmnQuizBotLambda)
    const commandPublisherUser = new iam.User(this, 'TelegramCommandPublisher', {
      userName: 'command-publisher'
    })

    commandPublisherUser.addToPolicy(ssmPolicy)
    commandTopic.grantPublish(commandPublisherUser)
  }
}
