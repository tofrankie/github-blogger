import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createLabel, deleteLabel, getLabels, updateLabel } from '@/utils/rpc'
import { useToast } from './use-toast'

export function useLabels() {
  return useQuery({
    queryKey: ['labels'],
    queryFn: getLabels,
    // placeholderData: [], TODO:
  })
}

export function useCreateLabel() {
  const toast = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (label: Omit<MinimalLabel, 'id'>) => createLabel(label),
    onSuccess: issue => {
      queryClient.invalidateQueries({ queryKey: ['labels'] })
      toast.success(`Label "${issue.name}" created.`)
    },
    onError: (error, variables) => {
      if (error.message.includes('already_exists')) {
        toast.critical(`Label "${variables.name}" has already been taken.`)
        return
      }
      toast.critical(error.message)
    },
  })
}

export function useUpdateLabel() {
  const toast = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      newLabel,
      oldLabel,
    }: {
      newLabel: Omit<MinimalLabel, 'id'>
      oldLabel: MinimalLabel
    }) => updateLabel(newLabel, oldLabel),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels'] })
    },
    onError: (error, variables) => {
      if (error.message.includes('already_exists')) {
        toast.critical(`Label "${variables.newLabel.name}" has already been taken.`)
        return
      }
      toast.critical(error.message)
    },
  })
}

export function useDeleteLabel() {
  const toast = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteLabel,
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['labels'] })
      toast.success(`Label "${variables}" deleted.`)
    },
    onError: error => {
      toast.critical(error.message)
    },
  })
}
