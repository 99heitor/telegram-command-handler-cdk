import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import * as codecommit from '@aws-cdk/aws-codecommit';
import * as codebuild from '@aws-cdk/aws-codebuild';
import { Construct, Stack, StackProps, Stage } from '@aws-cdk/core';
import { CdkPipeline, SimpleSynthAction } from "@aws-cdk/pipelines";

/**
 * The stack that defines the application pipeline
 */
export class TelegramCommandHandlerStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const cdkSourceArtifact = new codepipeline.Artifact();
    const cloudAssemblyArtifact = new codepipeline.Artifact();

    const cdkRepo = codecommit.Repository.fromRepositoryName(this, 'CdkSourceRepo', "telegram-command-handler-cdk");
    
 
    const pipeline = new CdkPipeline(this, 'Pipeline', {
      pipelineName: 'TelegramCommandHandlerPipeline',
      cloudAssemblyArtifact,

      sourceAction: new codepipeline_actions.CodeCommitSourceAction({
        actionName: 'CodeCommitCdkSourceUpdate',
        output: cdkSourceArtifact,
        repository: cdkRepo,
        branch: 'main'
      }),

       synthAction: SimpleSynthAction.standardNpmSynth({
         sourceArtifact: cdkSourceArtifact,
         cloudAssemblyArtifact,
         
         buildCommand: 'npm run build'
       }),
    });

    const pokemonQuizBotSourceArtifact = new codepipeline.Artifact();
    const pokemonQuizBotBuiltArtifact = new codepipeline.Artifact();
    const pokemonQuizBotRepo = codecommit.Repository.fromRepositoryName(this, 'PokemonQuizBotSourceRepo', "pokemon-quiz-bot");
    const pokemonQuizBotBuild = new codebuild.PipelineProject(this, 'PokemonQuizBotBuild', {
      environment: {
        buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2
      }
    })

    pipeline.stage('Source').addAction(
      new codepipeline_actions.CodeCommitSourceAction({
        actionName: "PkmnQuizBotSourceUpdate",
        output: pokemonQuizBotSourceArtifact,
        repository: pokemonQuizBotRepo,
        branch: 'master'
      })
    )

    const buildStage = pipeline.addStage('BuildCommandHandlerSource');
    buildStage.addActions(
      new codepipeline_actions.CodeBuildAction({
        actionName: "PokemonQuizBotBuild",
        input: pokemonQuizBotSourceArtifact,
        project: pokemonQuizBotBuild,
        outputs: [pokemonQuizBotBuiltArtifact]
      }))    
  }
}