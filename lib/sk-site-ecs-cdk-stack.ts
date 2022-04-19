import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

var shell = require('shelljs');

import * as ecr from "aws-cdk-lib/aws-ecr";
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';
import * as ecrDeploy from 'cdk-ecr-deployment';
import * as path from 'path';
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";

export class SkSiteEcsCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Using local Git client as a workaround to clone, build and push site assets as Docker image to ECR repo 
    // until Public ECR Repo support comes to CDK [https://github.com/aws/aws-cdk/issues/12162]
    if (!shell.which('git')) {
      shell.echo('Sorry, this deployment requires git installed on the local machine.');
      shell.exit(1);
    }

    if (shell.ls('stephen-krawczyk-site').code !== 0) {
      shell.exec('git clone https://github.com/moebaca/stephen-krawczyk-site.git');
    }

    const image = new DockerImageAsset(this, 'SKSiteBuildImage', {
      directory: 'stephen-krawczyk-site',
    });

    new ecrDeploy.ECRDeployment(this, 'DeployDockerImage', {
      src: new ecrDeploy.DockerImageName(image.imageUri),
      dest: new ecrDeploy.DockerImageName(`${image.imageUri}:latest`),
    });

    // Grab SK Docker Image from ECR
    const repo = ecr.Repository.fromRepositoryName(this, 'SkSiteImage', `${image.imageUri}:latest`);

    // New VPC with 2 Availability Zones
    const vpc = new ec2.Vpc(this, "SKSiteVpc", {
      maxAzs: 2
    });

    // Associate to new ECS Cluster w/ Container Insights
    const cluster = new ecs.Cluster(this, "SKSiteCluster", {
      vpc: vpc
    });

    // EC2 Capacity - Free Tier Eligible
    cluster.addCapacity('SKSiteClusterCapacity', {
      instanceType: new ec2.InstanceType("t2.micro"),
      desiredCapacity: 1,
    });
    
    // const loadBalancedFargateService = new ecsPatterns.ApplicationLoadBalancedEc2Service(this, 'SKService', {
    //   cluster,
    //   cpu: 256,
    //   memoryLimitMiB: 512,
    //   desiredCount: 1,
    //   circuitBreaker: { rollback: true },
    //   taskImageOptions: {
    //     image: ecs.ContainerImage.fromRegistry(image.imageUri)
    //   },
    //   publicLoadBalancer: true 
    // });

    // Create a load-balanced Fargate service and make it public
    // *Note* If using Mac M1 chip or other ARM CPU be sure to set the below Docker ENV variable
    // DOCKER_DEFAULT_PLATFORM='linux/amd64'
    // [https://github.com/aws/aws-cdk/issues/12472] - Can't pass in --platform
    const loadBalancedFargateService = new ecsPatterns.ApplicationLoadBalancedEc2Service(this, 'SKService', {
      cluster,
      cpu: 256,
      memoryLimitMiB: 512,
      desiredCount: 1,
      circuitBreaker: { rollback: true },
      taskImageOptions: {
        image: ecs.ContainerImage.fromAsset(path.join(__dirname, '../stephen-krawczyk-site')),
      },
      publicLoadBalancer: true 
    });
  }
}