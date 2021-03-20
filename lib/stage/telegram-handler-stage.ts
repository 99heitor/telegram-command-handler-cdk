import { CfnOutput, Construct, Stage, StageProps } from '@aws-cdk/core';
import { TelegramCommandHandlerStack } from '../stack/telegram-handler-stack';

/**
 * Deployable unit of web service app
 */
export class TelegramCommandHandlerStage extends Stage {
  
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    const service = new TelegramCommandHandlerStack(this, 'TelegramCommandHandlerStack');
    
  }
}