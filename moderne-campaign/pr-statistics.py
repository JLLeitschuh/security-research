import os
from typing import Any

import yaml
from github import Github, TimelineEventSource


def load_github() -> Github:
    with open(f'{os.path.expanduser("~")}/.config/hub') as hub_file:
        hub_config = yaml.safe_load(hub_file)
        return Github(login_or_token=hub_config['github.com'][0]['oauth_token'])


def print_current_rate_limit():
    rate_limit = load_github().get_rate_limit().core
    print(f'Current Rate Limit: {rate_limit}, reset time: {rate_limit.reset}')


def get_events_for_issue(issue_number: int):
    for event in load_github().get_repo('jlleitschuh/security-research').get_issue(issue_number).get_timeline():
        print(event)
        print(event.source)
        source: Any[TimelineEventSource, None] = event.source
        if source:
            print(source.issue)
            pull_request = source.issue.as_pull_request()
            if pull_request:
                print(pull_request)
                print(pull_request.is_merged())
        print('---\n')


def main():
    print_current_rate_limit()
    get_events_for_issue(16)


if __name__ == '__main__':
    main()
