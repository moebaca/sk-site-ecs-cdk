"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkSiteEcsCdkStack = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
var shell = require('shelljs');
const ecr = require("aws-cdk-lib/aws-ecr");
const aws_ecr_assets_1 = require("aws-cdk-lib/aws-ecr-assets");
const ecrDeploy = require("cdk-ecr-deployment");
const path = require("path");
const ec2 = require("aws-cdk-lib/aws-ec2");
const ecs = require("aws-cdk-lib/aws-ecs");
const ecsPatterns = require("aws-cdk-lib/aws-ecs-patterns");
class SkSiteEcsCdkStack extends aws_cdk_lib_1.Stack {
    constructor(scope, id, props) {
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
        const image = new aws_ecr_assets_1.DockerImageAsset(this, 'SKSiteBuildImage', {
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
exports.SkSiteEcsCdkStack = SkSiteEcsCdkStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2stc2l0ZS1lY3MtY2RrLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic2stc2l0ZS1lY3MtY2RrLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDZDQUFnRDtBQUdoRCxJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7QUFFL0IsMkNBQTJDO0FBQzNDLCtEQUE4RDtBQUM5RCxnREFBZ0Q7QUFDaEQsNkJBQTZCO0FBQzdCLDJDQUEyQztBQUMzQywyQ0FBMkM7QUFDM0MsNERBQTREO0FBRTVELE1BQWEsaUJBQWtCLFNBQVEsbUJBQUs7SUFDMUMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFrQjtRQUMxRCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QiwyR0FBMkc7UUFDM0csMkZBQTJGO1FBQzNGLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQ3ZCLEtBQUssQ0FBQyxJQUFJLENBQUMscUVBQXFFLENBQUMsQ0FBQztZQUNsRixLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ2Y7UUFFRCxJQUFJLEtBQUssQ0FBQyxFQUFFLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxFQUFFO1lBQ2hELEtBQUssQ0FBQyxJQUFJLENBQUMsZ0VBQWdFLENBQUMsQ0FBQztTQUM5RTtRQUVELE1BQU0sS0FBSyxHQUFHLElBQUksaUNBQWdCLENBQUMsSUFBSSxFQUFFLGtCQUFrQixFQUFFO1lBQzNELFNBQVMsRUFBRSx1QkFBdUI7U0FDbkMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxTQUFTLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxtQkFBbUIsRUFBRTtZQUNyRCxHQUFHLEVBQUUsSUFBSSxTQUFTLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUM7WUFDbEQsSUFBSSxFQUFFLElBQUksU0FBUyxDQUFDLGVBQWUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxRQUFRLFNBQVMsQ0FBQztTQUNoRSxDQUFDLENBQUM7UUFFSCxnQ0FBZ0M7UUFDaEMsTUFBTSxJQUFJLEdBQUcsR0FBRyxDQUFDLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLEVBQUUsYUFBYSxFQUFFLEdBQUcsS0FBSyxDQUFDLFFBQVEsU0FBUyxDQUFDLENBQUM7UUFFaEcsb0NBQW9DO1FBQ3BDLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsV0FBVyxFQUFFO1lBQ3pDLE1BQU0sRUFBRSxDQUFDO1NBQ1YsQ0FBQyxDQUFDO1FBRUgscURBQXFEO1FBQ3JELE1BQU0sT0FBTyxHQUFHLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFO1lBQ3JELEdBQUcsRUFBRSxHQUFHO1NBQ1QsQ0FBQyxDQUFDO1FBRUgsb0NBQW9DO1FBQ3BDLE9BQU8sQ0FBQyxXQUFXLENBQUMsdUJBQXVCLEVBQUU7WUFDM0MsWUFBWSxFQUFFLElBQUksR0FBRyxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUM7WUFDOUMsZUFBZSxFQUFFLENBQUM7U0FDbkIsQ0FBQyxDQUFDO1FBRUgsNEdBQTRHO1FBQzVHLGFBQWE7UUFDYixjQUFjO1FBQ2QseUJBQXlCO1FBQ3pCLHFCQUFxQjtRQUNyQix3Q0FBd0M7UUFDeEMsd0JBQXdCO1FBQ3hCLDZEQUE2RDtRQUM3RCxPQUFPO1FBQ1AsOEJBQThCO1FBQzlCLE1BQU07UUFFTiw0REFBNEQ7UUFDNUQsNEZBQTRGO1FBQzVGLHdDQUF3QztRQUN4QywyRUFBMkU7UUFDM0UsTUFBTSwwQkFBMEIsR0FBRyxJQUFJLFdBQVcsQ0FBQyxpQ0FBaUMsQ0FBQyxJQUFJLEVBQUUsV0FBVyxFQUFFO1lBQ3RHLE9BQU87WUFDUCxHQUFHLEVBQUUsR0FBRztZQUNSLGNBQWMsRUFBRSxHQUFHO1lBQ25CLFlBQVksRUFBRSxDQUFDO1lBQ2YsY0FBYyxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRTtZQUNsQyxnQkFBZ0IsRUFBRTtnQkFDaEIsS0FBSyxFQUFFLEdBQUcsQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLDBCQUEwQixDQUFDLENBQUM7YUFDdEY7WUFDRCxrQkFBa0IsRUFBRSxJQUFJO1NBQ3pCLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXZFRCw4Q0F1RUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBTdGFjaywgU3RhY2tQcm9wcyB9IGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG52YXIgc2hlbGwgPSByZXF1aXJlKCdzaGVsbGpzJyk7XG5cbmltcG9ydCAqIGFzIGVjciBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWVjclwiO1xuaW1wb3J0IHsgRG9ja2VySW1hZ2VBc3NldCB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1lY3ItYXNzZXRzJztcbmltcG9ydCAqIGFzIGVjckRlcGxveSBmcm9tICdjZGstZWNyLWRlcGxveW1lbnQnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIGVjMiBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWVjMlwiO1xuaW1wb3J0ICogYXMgZWNzIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtZWNzXCI7XG5pbXBvcnQgKiBhcyBlY3NQYXR0ZXJucyBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWVjcy1wYXR0ZXJuc1wiO1xuXG5leHBvcnQgY2xhc3MgU2tTaXRlRWNzQ2RrU3RhY2sgZXh0ZW5kcyBTdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8gVXNpbmcgbG9jYWwgR2l0IGNsaWVudCBhcyBhIHdvcmthcm91bmQgdG8gY2xvbmUsIGJ1aWxkIGFuZCBwdXNoIHNpdGUgYXNzZXRzIGFzIERvY2tlciBpbWFnZSB0byBFQ1IgcmVwbyBcbiAgICAvLyB1bnRpbCBQdWJsaWMgRUNSIFJlcG8gc3VwcG9ydCBjb21lcyB0byBDREsgW2h0dHBzOi8vZ2l0aHViLmNvbS9hd3MvYXdzLWNkay9pc3N1ZXMvMTIxNjJdXG4gICAgaWYgKCFzaGVsbC53aGljaCgnZ2l0JykpIHtcbiAgICAgIHNoZWxsLmVjaG8oJ1NvcnJ5LCB0aGlzIGRlcGxveW1lbnQgcmVxdWlyZXMgZ2l0IGluc3RhbGxlZCBvbiB0aGUgbG9jYWwgbWFjaGluZS4nKTtcbiAgICAgIHNoZWxsLmV4aXQoMSk7XG4gICAgfVxuXG4gICAgaWYgKHNoZWxsLmxzKCdzdGVwaGVuLWtyYXdjenlrLXNpdGUnKS5jb2RlICE9PSAwKSB7XG4gICAgICBzaGVsbC5leGVjKCdnaXQgY2xvbmUgaHR0cHM6Ly9naXRodWIuY29tL21vZWJhY2Evc3RlcGhlbi1rcmF3Y3p5ay1zaXRlLmdpdCcpO1xuICAgIH1cblxuICAgIGNvbnN0IGltYWdlID0gbmV3IERvY2tlckltYWdlQXNzZXQodGhpcywgJ1NLU2l0ZUJ1aWxkSW1hZ2UnLCB7XG4gICAgICBkaXJlY3Rvcnk6ICdzdGVwaGVuLWtyYXdjenlrLXNpdGUnLFxuICAgIH0pO1xuXG4gICAgbmV3IGVjckRlcGxveS5FQ1JEZXBsb3ltZW50KHRoaXMsICdEZXBsb3lEb2NrZXJJbWFnZScsIHtcbiAgICAgIHNyYzogbmV3IGVjckRlcGxveS5Eb2NrZXJJbWFnZU5hbWUoaW1hZ2UuaW1hZ2VVcmkpLFxuICAgICAgZGVzdDogbmV3IGVjckRlcGxveS5Eb2NrZXJJbWFnZU5hbWUoYCR7aW1hZ2UuaW1hZ2VVcml9OmxhdGVzdGApLFxuICAgIH0pO1xuXG4gICAgLy8gR3JhYiBTSyBEb2NrZXIgSW1hZ2UgZnJvbSBFQ1JcbiAgICBjb25zdCByZXBvID0gZWNyLlJlcG9zaXRvcnkuZnJvbVJlcG9zaXRvcnlOYW1lKHRoaXMsICdTa1NpdGVJbWFnZScsIGAke2ltYWdlLmltYWdlVXJpfTpsYXRlc3RgKTtcblxuICAgIC8vIE5ldyBWUEMgd2l0aCAyIEF2YWlsYWJpbGl0eSBab25lc1xuICAgIGNvbnN0IHZwYyA9IG5ldyBlYzIuVnBjKHRoaXMsIFwiU0tTaXRlVnBjXCIsIHtcbiAgICAgIG1heEF6czogMlxuICAgIH0pO1xuXG4gICAgLy8gQXNzb2NpYXRlIHRvIG5ldyBFQ1MgQ2x1c3RlciB3LyBDb250YWluZXIgSW5zaWdodHNcbiAgICBjb25zdCBjbHVzdGVyID0gbmV3IGVjcy5DbHVzdGVyKHRoaXMsIFwiU0tTaXRlQ2x1c3RlclwiLCB7XG4gICAgICB2cGM6IHZwY1xuICAgIH0pO1xuXG4gICAgLy8gRUMyIENhcGFjaXR5IC0gRnJlZSBUaWVyIEVsaWdpYmxlXG4gICAgY2x1c3Rlci5hZGRDYXBhY2l0eSgnU0tTaXRlQ2x1c3RlckNhcGFjaXR5Jywge1xuICAgICAgaW5zdGFuY2VUeXBlOiBuZXcgZWMyLkluc3RhbmNlVHlwZShcInQyLm1pY3JvXCIpLFxuICAgICAgZGVzaXJlZENhcGFjaXR5OiAxLFxuICAgIH0pO1xuICAgIFxuICAgIC8vIGNvbnN0IGxvYWRCYWxhbmNlZEZhcmdhdGVTZXJ2aWNlID0gbmV3IGVjc1BhdHRlcm5zLkFwcGxpY2F0aW9uTG9hZEJhbGFuY2VkRWMyU2VydmljZSh0aGlzLCAnU0tTZXJ2aWNlJywge1xuICAgIC8vICAgY2x1c3RlcixcbiAgICAvLyAgIGNwdTogMjU2LFxuICAgIC8vICAgbWVtb3J5TGltaXRNaUI6IDUxMixcbiAgICAvLyAgIGRlc2lyZWRDb3VudDogMSxcbiAgICAvLyAgIGNpcmN1aXRCcmVha2VyOiB7IHJvbGxiYWNrOiB0cnVlIH0sXG4gICAgLy8gICB0YXNrSW1hZ2VPcHRpb25zOiB7XG4gICAgLy8gICAgIGltYWdlOiBlY3MuQ29udGFpbmVySW1hZ2UuZnJvbVJlZ2lzdHJ5KGltYWdlLmltYWdlVXJpKVxuICAgIC8vICAgfSxcbiAgICAvLyAgIHB1YmxpY0xvYWRCYWxhbmNlcjogdHJ1ZSBcbiAgICAvLyB9KTtcblxuICAgIC8vIENyZWF0ZSBhIGxvYWQtYmFsYW5jZWQgRmFyZ2F0ZSBzZXJ2aWNlIGFuZCBtYWtlIGl0IHB1YmxpY1xuICAgIC8vICpOb3RlKiBJZiB1c2luZyBNYWMgTTEgY2hpcCBvciBvdGhlciBBUk0gQ1BVIGJlIHN1cmUgdG8gc2V0IHRoZSBiZWxvdyBEb2NrZXIgRU5WIHZhcmlhYmxlXG4gICAgLy8gRE9DS0VSX0RFRkFVTFRfUExBVEZPUk09J2xpbnV4L2FtZDY0J1xuICAgIC8vIFtodHRwczovL2dpdGh1Yi5jb20vYXdzL2F3cy1jZGsvaXNzdWVzLzEyNDcyXSAtIENhbid0IHBhc3MgaW4gLS1wbGF0Zm9ybVxuICAgIGNvbnN0IGxvYWRCYWxhbmNlZEZhcmdhdGVTZXJ2aWNlID0gbmV3IGVjc1BhdHRlcm5zLkFwcGxpY2F0aW9uTG9hZEJhbGFuY2VkRWMyU2VydmljZSh0aGlzLCAnU0tTZXJ2aWNlJywge1xuICAgICAgY2x1c3RlcixcbiAgICAgIGNwdTogMjU2LFxuICAgICAgbWVtb3J5TGltaXRNaUI6IDUxMixcbiAgICAgIGRlc2lyZWRDb3VudDogMSxcbiAgICAgIGNpcmN1aXRCcmVha2VyOiB7IHJvbGxiYWNrOiB0cnVlIH0sXG4gICAgICB0YXNrSW1hZ2VPcHRpb25zOiB7XG4gICAgICAgIGltYWdlOiBlY3MuQ29udGFpbmVySW1hZ2UuZnJvbUFzc2V0KHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi9zdGVwaGVuLWtyYXdjenlrLXNpdGUnKSksXG4gICAgICB9LFxuICAgICAgcHVibGljTG9hZEJhbGFuY2VyOiB0cnVlIFxuICAgIH0pO1xuICB9XG59Il19