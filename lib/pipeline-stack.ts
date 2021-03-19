import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import * as codecommit from '@aws-cdk/aws-codecommit';
import { Construct, SecretValue, Stack, StackProps } from '@aws-cdk/core';
import { CdkPipeline, SimpleSynthAction } from "@aws-cdk/pipelines";

/**
 * The stack that defines the application pipeline
 */
export class TelegramCommandHandlerStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const sourceArtifact = new codepipeline.Artifact();
    const cloudAssemblyArtifact = new codepipeline.Artifact();

    const repo = codecommit.Repository.fromRepositoryName(this, 'CdkSourceRepo', "telegram-command-handler-cdk");
    
 
    const pipeline = new CdkPipeline(this, 'Pipeline', {
      pipelineName: 'TelegramCommandHandlerPipeline',
      cloudAssemblyArtifact,

      sourceAction: new codepipeline_actions.CodeCommitSourceAction({
        actionName: 'CodeCommitCdkSource',
        output: sourceArtifact,
        repository: repo,
        branch: 'main'
      }),

       synthAction: SimpleSynthAction.standardNpmSynth({
         sourceArtifact,
         cloudAssemblyArtifact,
         
         buildCommand: 'npm run build'
       }),
    });
  }
}