import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import * as codecommit from '@aws-cdk/aws-codecommit';
import * as codebuild from '@aws-cdk/aws-codebuild';
import * as lambda from '@aws-cdk/aws-lambda';
import { Construct, Stack, StackProps, Stage } from '@aws-cdk/core';

export interface PipelineStackProps extends StackProps {
  readonly pkmnQuizBotCode: lambda.CfnParametersCode;
}

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    const cdkSourceAtifact = new codepipeline.Artifact('CdkSourceArtifact');
    const cdkBuildArtifact = new codepipeline.Artifact('CdkBuildOutput');
    const cdkRepo = codecommit.Repository.fromRepositoryName(this, 'CdkSourceRepo', "telegram-command-handler-cdk");
    const cdkBuild = new codebuild.PipelineProject(this, 'CdkBuild', {
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_2_0,
      },
    });

    const pkmnQuizBotSourceArtifact = new codepipeline.Artifact('PkmnSourceArtifact');
    const pkmnQuizBotBuildArtifact = new codepipeline.Artifact('PkmnBuildArtifact');
    const pkmnQuizBotRepo = codecommit.Repository.fromRepositoryName(this, 'PkmnQuizBotSourceRepo', "pokemon-quiz-bot");
    const pkmnQuizBotBuild = new codebuild.PipelineProject(this, 'PkmnQuizBotBuild', {
      environment: {
        buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2
      }
    })
    
    new codepipeline.Pipeline(this, 'Pipeline', {
      stages: [
        {
          stageName: 'Source',
          actions: [
            new codepipeline_actions.CodeCommitSourceAction({
              actionName: 'CodeCommit_Cdk_Source',
              repository: cdkRepo,
              output: cdkSourceAtifact,
              branch: 'main'
            }),
            new codepipeline_actions.CodeCommitSourceAction({
              actionName: 'CodeCommit_PkmnQuizBot_Source',
              repository: pkmnQuizBotRepo,
              output: pkmnQuizBotSourceArtifact,
              branch: 'lambda'
            })
          ],
        },
        {
          stageName: 'Build',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'CDK_Build',
              project: cdkBuild,
              input: cdkSourceAtifact,
              outputs: [cdkBuildArtifact],
            }),
            new codepipeline_actions.CodeBuildAction({
              actionName: 'PkmnQuizBot_Build',
              project: pkmnQuizBotBuild,
              input: pkmnQuizBotSourceArtifact,
              outputs: [pkmnQuizBotBuildArtifact],
            }),
          ],
        },
        {
          stageName: 'Deploy',
          actions: [
            new codepipeline_actions.CloudFormationCreateUpdateStackAction({
              actionName: 'TelegramCommandHandler_CFN_Deploy',
              templatePath: cdkBuildArtifact.atPath('TelegramCommandHandlerStack.template.json'),
              stackName: 'TelegramCommandHandlerStack',
              adminPermissions: true,
              parameterOverrides: {
                ...props.pkmnQuizBotCode.assign(pkmnQuizBotBuildArtifact.s3Location),
              },
              extraInputs: [pkmnQuizBotBuildArtifact],
            }),
          ],
        },
      ],
    });
    
  }
}