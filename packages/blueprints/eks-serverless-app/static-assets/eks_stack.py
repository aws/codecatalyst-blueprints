from aws_cdk import core as cdk
from aws_cdk import aws_iam as iam
from aws_cdk import aws_eks as eks
from aws_cdk import aws_ec2 as ec2
import yaml


class EksStack(cdk.Stack):

    def __init__(self, scope: cdk.Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Look up the default VPC
        vpc = ec2.Vpc.from_lookup(self, id="VPC", is_default=True)

        # Create master role for EKS Cluster
        iam_role = iam.Role(self, id=f"{construct_id}-iam",
                            role_name=f"{construct_id}-iam",
                            assumed_by=iam.AccountRootPrincipal())

        # Creating Cluster with EKS
        eks_cluster = eks.Cluster(
            self, id=f"{construct_id}-cluster",
            cluster_name=f"{construct_id}-cluster",
            vpc=vpc,
            vpc_subnets=vpc.public_subnets,
            masters_role=iam_role,
            default_capacity_instance=ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.MICRO),
            version=eks.KubernetesVersion.V1_20,
        )

        # Read the deployment config
        with open("kubernetes_objects/deployment.yaml", 'r') as stream:
            deployment_yaml = yaml.load(stream, Loader=yaml.FullLoader)

        # Read the service config
        with open("kubernetes_objects/service.yaml", 'r') as stream:
            service_yaml = yaml.load(stream, Loader=yaml.FullLoader)

        eks_cluster.add_manifest(f"{construct_id}-app-deployment", deployment_yaml)

        eks_cluster.add_manifest(f"{construct_id}-app-service", service_yaml)
