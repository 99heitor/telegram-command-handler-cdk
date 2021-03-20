import * as lambda from '@aws-cdk/aws-lambda';
import { Construct, Stack, StackProps } from '@aws-cdk/core';


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
    
  }
}