export function normalizeIssueFromRest(issue: RestIssue): MinimalIssue {
  const newIssue = issue.labels.map(item => {
    if (typeof item === 'string') {
      return {
        id: item,
        name: item,
        color: '',
        description: null,
      }
    }

    return {
      id: item.node_id ?? '',
      name: item.name ?? '',
      color: item.color ?? '',
      description: item.description ?? null,
    }
  })

  return {
    id: issue.node_id,
    number: issue.number,
    url: issue.html_url,
    title: issue.title,
    body: issue.body ?? '',
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
    labels: newIssue,
  }
}

export function normalizeIssueFromGraphql(issue: GraphqlIssue): MinimalIssue {
  return {
    id: issue.id,
    number: issue.number,
    url: issue.url,
    title: issue.title,
    body: issue.body,
    createdAt: issue.createdAt,
    updatedAt: issue.updatedAt,
    labels: issue.labels.nodes.map(label => ({
      id: label.id,
      name: label.name,
      color: label.color,
      description: label.description,
    })),
  }
}

export function normalizeLabelFromRest(label: RestLabel): MinimalLabel {
  return {
    id: label.node_id,
    name: label.name,
    color: label.color,
    description: label.description,
  }
}
