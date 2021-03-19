#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { PipelineGeckoCdkStack } from '../lib/pipeline-stack';

const app = new cdk.App();
new PipelineGeckoCdkStack(app, 'PipelineGeckoCdkStack');

app.synth();