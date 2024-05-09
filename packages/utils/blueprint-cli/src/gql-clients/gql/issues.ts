import { gql } from '@apollo/client/core';

//issue apis
export const ListIssues = gql`
  query ListIssuesInternal($input: ListIssuesInternalInput!) {
    listIssuesInternal(input: $input) {
      items {
        id
        lastUpdatedTime
        versionId
      }
    }
  }
`;

export const GetIssue = gql`
  query GetIssue($input: GetIssueInput!) {
    getIssue(input: $input) {
      item {
        id
        title
        lastUpdatedTime
        versionId
        statusId
        description
        issueStoreId
        archived
        blocked
        assigneeIds
        updatedBy
        createdBy
        createdTime
        priority
        labelIds
        estimate
        rank
        customFields {
          name
          type
          value
        }
      }
    }
  }
`;

export const BatchGetIssue = gql`
  query BatchGetIssue($input: BatchGetIssueInput!) {
    batchGetIssue(input: $input) {
      items {
        id
        title
        lastUpdatedTime
        versionId
        statusId
        description
        issueStoreId
        archived
        blocked
        assigneeIds
        updatedBy
        createdBy
        createdTime
        priority
        labelIds
        estimate
        rank
        customFields {
          name
          type
          value
        }
      }
    }
  }
`;

//issue store apis
export const ListIssueStoreStatuses = gql`
  query ListIssueStoreStatuses($input: ListIssueStoreStatusesRequestInput!) {
    listIssueStoreStatuses(input: $input) {
      items {
        id
        name
        highLevelStatus
        active
        order
      }
    }
  }
`;

export const GetIssueStore = gql`
  query GetIssueStore($input: GetIssueStoreInput!) {
    getIssueStore(input: $input) {
      item {
        id
        lastUpdatedTime
        estimationType
        maxAssigneesPerIssue
        versionId
      }
    }
  }
`;

export const ListIssueStoreSavedViews = gql`
  query ListIssueStoreSavedViews($input: ListIssueStoreSavedViewsRequestInput!) {
    listIssueStoreSavedViews(input: $input) {
      items {
        id
        name
        query
      }
    }
  }
`;

//issue label apis
export const CreateIssueStoreLabel = gql`
  mutation CreateIssueStoreLabel($input: CreateIssueStoreLabelRequestInput!) {
    createIssueStoreLabel(input: $input) {
      id
    }
  }
`;

export const ListIssueStoreLabels = gql`
  query ListIssueStoreLabels($input: ListIssueStoreLabelsRequestInput!) {
    listIssueStoreLabels(input: $input) {
      items {
        id
        name
        labelColor
      }
    }
  }
`;
