ENV ?= dev
ENV_DIR := envs/$(ENV)

.PHONY: init fmt validate plan apply destroy

init:
	cd $(ENV_DIR) && terraform init

fmt:
	terraform fmt -recursive

validate:
	cd $(ENV_DIR) && terraform validate

plan:
	cd $(ENV_DIR) && terraform plan

apply:
	cd $(ENV_DIR) && terraform apply

destroy:
	cd $(ENV_DIR) && terraform destroy
