module repo {
  source = "git@github.com:jsmrcaga/terraform-modules//github-repo?ref=v0.1.0"

  name = "assembly-line"
  topics = ["tasks", "management", "async", "microservices"]

  visibility = "public"

  github = {
    token = var.github.token
  }
}
