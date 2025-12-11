FROM public.ecr.aws/x8v8d7g8/mars-base:latest

WORKDIR /app

COPY . .

# corepack enable is required to use Yarn 4.10.2 specified in package.json
# (base image has Yarn 1.22.22, but project requires Yarn 4.10.2 via packageManager field)
RUN corepack enable && yarn install

CMD ["/bin/bash"]

