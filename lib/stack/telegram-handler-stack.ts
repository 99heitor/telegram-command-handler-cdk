import * as lambda from '@aws-cdk/aws-lambda';
import * as sqs from '@aws-cdk/aws-sqs';
import * as sns from '@aws-cdk/aws-sns';
import * as subscriptions from '@aws-cdk/aws-sns-subscriptions';
import { Construct, Stack, StackProps } from '@aws-cdk/core';
import { SqsEventSource } from '@aws-cdk/aws-lambda-event-sources';

export class TelegramCommandHandlerStack extends Stack {  
  public readonly pkmnQuizBotCode: lambda.CfnParametersCode;
  
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
        
    this.pkmnQuizBotCode = lambda.Code.fromCfnParameters();
    const pkmnQuizBotLambda = new lambda.Function(this, 'Lambda', {
      runtime: lambda.Runtime.GO_1_X,
      handler: 'main',
      code: this.pkmnQuizBotCode,
    });
    
    const pkmnCommandQueue = new sqs.Queue(this, 'PokemonCommandQueue', {
      queueName: 'pokemon-quiz-command-queue'
    });
    pkmnQuizBotLambda.addEventSource(new SqsEventSource(pkmnCommandQueue))
    
    const generalCommandTopic = new sns.Topic(this, 'TelegramCommandTopic', {
      topicName: "telegram-command-topic"
    })
    generalCommandTopic.addSubscription(new subscriptions.SqsSubscription(pkmnCommandQueue, {
      filterPolicy: {
        "bot": sns.SubscriptionFilter.stringFilter({whitelist: ["pokemon_quiz_bot"]})
      }
    }))
  }
}
