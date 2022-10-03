import argparse
import base64
import json
import os
import time
from dataclasses import dataclass
from typing import List, Dict, Any, Tuple

from gql import gql, Client
from gql.transport.aiohttp import AIOHTTPTransport

moderne_api_token = os.getenv("MODERNE_API_TOKEN")
if not moderne_api_token:
    raise Exception("MODERNE_API_TOKEN environment variable is not set")

# Select your transport with a defined url endpoint
transport = AIOHTTPTransport(
    url="https://api.public.moderne.io/",
    headers={
        "Authorization": f'Bearer {moderne_api_token}'
    }
)

# Create a GraphQL client using the defined transport
client = Client(transport=transport, fetch_schema_from_transport=True)


@dataclass(frozen=True)
class Campaign:
    name: str
    recipe_id: str
    branch: str
    commit_title: str
    commit_extended: str
    pr_title: str
    pr_body: str

    @staticmethod
    def create(name: str) -> 'Campaign':
        commit = Campaign._load_file_contents_as_title_and_body(f"{name}/commit.txt")
        pr_message = Campaign._load_file_contents_as_title_and_body(f"{name}/pr_message.md")
        return Campaign(
            name=name,
            recipe_id=Campaign._load_file_contents(f"{name}/recipe.txt").strip(),
            branch=Campaign._load_file_contents(f"{name}/branch_name.txt").strip(),
            commit_title=commit[0],
            commit_extended=commit[1],
            pr_title=pr_message[0],
            pr_body=pr_message[1],
        )

    @staticmethod
    def _load_file_contents(path: str) -> str:
        path = os.path.join('bulk-pr-generation', path)
        if not os.path.exists(path):
            raise Exception(f"File {path} does not exist, and must to create a campaign")
        with open(path, 'r') as f:
            return f.read()

    @staticmethod
    def _load_file_contents_as_title_and_body(path: str) -> Tuple[str, str]:
        path = os.path.join('bulk-pr-generation', path)
        if not os.path.exists(path):
            raise Exception(f"File {path} does not exist, and must to create a campaign")
        with open(path, 'r') as f:
            return f.readline(), f.read()


@dataclass(frozen=True)
class GpgKeyConfig:
    key_passphrase: str
    key_private_key: str
    key_public_key: str

    @staticmethod
    def load() -> 'GpgKeyConfig':
        return GpgKeyConfig(
            key_passphrase=GpgKeyConfig._load_env("GPG_KEY_PASSPHRASE"),
            key_private_key=GpgKeyConfig._load_env("GPG_KEY_PRIVATE_KEY"),
            key_public_key=GpgKeyConfig._load_env("GPG_KEY_PUBLIC_KEY")
        )

    @staticmethod
    def _load_env(env_name: str) -> str:
        env = os.getenv(env_name)
        if not env:
            raise Exception(f"{env_name} environment variable is not set")
        return env


def run_security_fix(recipe_id: str) -> str:
    run_fix_query = gql(
        # language=GraphQL
        """
        mutation runSecurityFix($run: RecipeRunInput!) {
          runRecipe(run: $run) {
            id
            start
          }
        }
        """
    )

    params = {
        "run": {
            "recipe": {
                "id": recipe_id
            }
        }
    }
    # Execute the query on the transport
    result = client.execute(run_fix_query, variable_values=params)
    print(result)
    return result["runRecipe"]["id"]


def query_recipe_run_status(recipe_run_id: str) -> str:
    recipe_run_results = gql(
        # language=GraphQL
        """
        query getRecipeRun($id: ID!) {
            recipeRun(id: $id) {
                id
                state
                totals {
                    totalFilesChanged
                    totalFilesSearched
                    totalRepositoriesSuccessful
                    totalRepositoriesWithErrors
                    totalRepositoriesWithResults
                    totalResults
                    totalTimeSavings
                }
            }
        }
        """
    )
    params = {
        "id": recipe_run_id
    }
    result = client.execute(recipe_run_results, variable_values=params)
    print(result)
    return result["recipeRun"]["state"]


def query_recipe_run_results(recipe_run_id: str) -> List[Dict[str, Any]]:
    def query_recipient_run_results_page(recipe_run_id: str, after: int) -> dict:
        recipe_run_results = gql(
            # language=GraphQL
            """
            query getRecipeRun($id: ID!, $after: String) {
              recipeRun(id: $id) {
                id
                state
                summaryResultsPages(after: $after, filterBy: {statuses: [FINISHED], onlyWithResults:true}) {
                  pageInfo {
                    hasNextPage
                    startCursor
                    endCursor
                  }
                  count
                  edges {
                    node {
                      repository {
                        origin
                        path
                        branch
                      }
                    }
                  }
                }
              }
            }
            """
        )
        params = {
            "id": recipe_run_id,
            "after": str(after)
        }
        result = client.execute(recipe_run_results, variable_values=params)
        return result["recipeRun"]["summaryResultsPages"]

    after = -1
    results: List[Any] = []
    while True:
        page = query_recipient_run_results_page(recipe_run_id, after)
        results.extend([edge["node"]["repository"] for edge in page["edges"]])
        if not page["pageInfo"]["hasNextPage"]:
            break
        after = page["pageInfo"]["endCursor"]

    return results


def fork_and_pull_request(recipe_id: str,
                          campaign: Campaign,
                          gpg_key_config: GpgKeyConfig,
                          repositories: List[Dict[str, str]]) -> str:
    fork_and_pull_request_query = gql(
        # language=GraphQL
        """
        mutation forkAndPullRequest(
          $commit: CommitInput!,
          $organization: String!,
          $pullRequestBody:Base64!,
          $pullRequestTitle:String!
        ) {
            forkAndPullRequest(
                commit: $commit,
                draft: false,
                maintainerCanModify: true,
                organization: $organization,
                pullRequestBody: $pullRequestBody,
                pullRequestTitle: $pullRequestTitle,
                shouldPrefixOrganizationName: true
            ) {
                id
            }
        }
        """
    )

    params = {
        "commit": {
            "branchName": campaign.branch,
            "gpgKey": {
                "passphrase": gpg_key_config.key_passphrase,
                "privateKey": gpg_key_config.key_private_key.replace("\\n", "\n"),
                "publicKey": gpg_key_config.key_public_key.replace("\\n", "\n")
            },
            "message": campaign.commit_title,
            "extendedMessage": base64.b64encode(campaign.commit_extended.encode()).decode(),
            "recipeRunId": recipe_id,
            "repositories": repositories
        },
        "organization": "BulkSecurityGeneratorProjectV2",
        "pullRequestTitle": campaign.pr_title,
        "pullRequestBody": base64.b64encode(campaign.pr_body.encode()).decode()
    }
    # Execute the query on the transport
    # print(json.dumps(params, indent=4))
    result = client.execute(fork_and_pull_request_query, variable_values=params)
    print(result)
    return result["forkAndPullRequest"]["id"]


def query_commit_job_status(commit_job_id: str) -> str:
    def query_commit_job_status_page(after: int) -> dict:
        commit_job_status_query = gql(
            # language=GraphQL
            """
            query getCommitJob($id: ID!, $after: String) {
                commitJob(id: $id) {
                    id
                    completed
                    commits(after: $after) {
                        pageInfo {
                            hasNextPage
                            startCursor
                            endCursor
                        }
                        count
                        edges {
                            node {
                                modified
                                repository {
                                    origin
                                    path
                                    branch
                                    weight
                                }
                                resultLink
                                state
                                stateMessage
                            }
                        }
                    }
                    summaryResults {
                        count
                        failedCount
                        noChangeCount
                        successfulCount
                    }
                }
            }
            """
        )
        params = {
            "id": commit_job_id
        }
        if after is not None:
            params["after"] = str(after)
        result = client.execute(commit_job_status_query, variable_values=params)
        print(result)
        return result

    after = None
    results: List[Any] = []
    while True:
        commit_status = query_commit_job_status_page(after)["commitJob"]
        page = commit_status["commits"]
        results.extend([edge["node"] for edge in page["edges"]])
        if not page["pageInfo"]["hasNextPage"]:
            break
        after = page["pageInfo"]["endCursor"]
    summary_results = commit_status["summaryResults"]
    print(f"Summary results: {summary_results}")
    if summary_results["count"] == commit_status["completed"]:
        return "COMPLETED"
    elif summary_results["failedCount"] + summary_results["noChangeCount"] + summary_results["successfulCount"] < \
            summary_results["count"]:
        return "RUNNING"
    else:
        return "COMPLETED"


def main():
    if not os.path.exists('bulk-pr-generation'):
        print(
            'bulk-pr-generation directory does not exist. Please run this script with the working directory in the '
            'repository root directory.')
        exit(1)

    gpg_key_config = GpgKeyConfig.load()

    parser = argparse.ArgumentParser(description='Run a campaign to fix security vulnerabilities using Moderne.')
    parser.add_argument('--campaign-id',
                        type=str,
                        required=True,
                        help='The campaign to to run. Must match the name of the directory in `bulk-pr-generation`.'
                             'For example, if the campaign is in `bulk-pr-generation/fix-foo`, '
                             'then the campaign ID is `fix-foo`.')

    args = parser.parse_args()
    campaign = Campaign.create(args.campaign_id)

    print(f"Running campaign {campaign.name}...")
    run_id = run_security_fix(campaign.recipe_id)

    print(f"Waiting for recipe run {run_id} to complete...")
    while True:
        state = query_recipe_run_status(run_id)
        print(f"Recipe {run_id} state: {state}")
        if state == "FINISHED":
            print("Recipe run FINISHED")
            break
        elif state == "CANCELED":
            print("Recipe run CANCELED")
            break
        time.sleep(5)

    print(f"Querying recipe run {run_id} results...")
    repositories = query_recipe_run_results(run_id)
    print(repositories)
    print(len(repositories))

    print(f"Forking and creating pull requests for campaign {campaign.name}...")
    commit_id = fork_and_pull_request(run_id, campaign, gpg_key_config, repositories)
    print(f"Waiting for commit job {commit_id} to complete...")
    while True:
        status = query_commit_job_status(commit_id)
        if status == "COMPLETED":
            print("Commit job COMPLETED")
            break
        time.sleep(5)
    print(f'Campaign {campaign.name} completed!')


if __name__ == "__main__":
    main()
