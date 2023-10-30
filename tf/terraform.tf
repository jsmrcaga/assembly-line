terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
      version = "> 4.60.0"
    }
  }
}

provider "aws" {
  region = "eu-west-3"
  shared_credentials_files = ["./aws.cred"]
}
