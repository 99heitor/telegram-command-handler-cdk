#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { TelegramCommandHandlerStack } from '../lib/pipeline-stack';

const app = new cdk.App();
new TelegramCommandHandlerStack(app, 'TelegramCommandHandlerStack', {
    env: {region: 'us-west-2'}
});

app.synth();