import { CfnOutput, Construct, Stage, StageProps } from '@aws-cdk/core';
import { LambdaStack } from '../stack/telegram-handler-stack';

/**
 * Deployable unit of web service app
 */
export class ProdStage extends Stage {
  public readonly urlOutput: CfnOutput;
  
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    const service = new LambdaStack(this, 'LambdaStack');
    
  }
}