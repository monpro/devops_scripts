import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda-nodejs';
import {Bucket, BucketEncryption} from "@aws-cdk/aws-s3";
import {Runtime} from "@aws-cdk/aws-lambda";
import * as path from "path";
import {BucketDeployment, Source} from "@aws-cdk/aws-s3-deployment";
import {PolicyStatement} from "@aws-cdk/aws-iam";

export class SampleAppStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new Bucket(this, 'SampleBucket', {
      encryption: BucketEncryption.S3_MANAGED
    });

    new BucketDeployment(this, 'SampleAppPhotos', {
      sources: [
        Source.asset(path.join(__dirname, '..', 'photos'))
      ],
      destinationBucket: bucket
    });

    const getPhotos = new lambda.NodejsFunction(this, 'SampleLambda', {
      runtime: Runtime.NODEJS_12_X,
      entry: path.join(__dirname, '..', 'api', 'get-photos', 'index.ts'),
      handler: 'getPhotos',
      environment: {
        PHOTO_BUCKET_NAME: bucket.bucketName
      }
    });

    const bucketContainerPermissions = new PolicyStatement();
    bucketContainerPermissions.addResources(bucket.bucketArn);
    bucketContainerPermissions.addActions('s3:ListBucket');

    const bucketObjectPermissions = new PolicyStatement();
    bucketObjectPermissions.addResources(`${bucket.bucketArn}/*`);
    bucketObjectPermissions.addActions('s3:GetObject', 's3:PutObject');

    getPhotos.addToRolePolicy(bucketContainerPermissions);
    getPhotos.addToRolePolicy(bucketObjectPermissions);

    new cdk.CfnOutput(this, 'SampleBucketNameExport', {
      value: bucket.bucketName,
      exportName: "SampleBucketName"
    })

  }
}
