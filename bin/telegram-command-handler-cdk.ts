#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { PipelineStack } from '../lib/stack/pipeline-stack';
import { TelegramCommandHandlerStack } from '../lib/stack/telegram-handler-stack'

const app = new cdk.App();
const telegramCommandHandlerStack = new TelegramCommandHandlerStack(app, 'TelegramCommandHandlerStack');
new PipelineStack(app, 'PipelineStack', {
    env: {region: 'eu-central-1'},
    pkmnQuizBotCode: telegramCommandHandlerStack.pkmnQuizBotCode,
    naviBotCode: telegramCommandHandlerStack.naviBotCode,
});

app.synth();