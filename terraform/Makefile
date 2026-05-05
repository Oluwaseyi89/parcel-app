ENV ?= dev
ENV_DIR := envs/$(ENV)

.PHONY: init fmt validate plan apply destroy fmt-all validate-all plan-all

init:
	cd $(ENV_DIR) && terraform init

fmt:
	terraform fmt -recursive

fmt-all:
	./tf-all.sh fmt

validate:
	cd $(ENV_DIR) && terraform validate

validate-all:
	./tf-all.sh validate

plan:
	cd $(ENV_DIR) && terraform plan

plan-all:
	./tf-all.sh plan

apply:
	cd $(ENV_DIR) && terraform apply

destroy:
	cd $(ENV_DIR) && terraform destroy
