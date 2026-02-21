import { useQuery } from '@tanstack/react-query'
import { getRepo } from '@/utils/rpc'

export function useRepo() {
  return useQuery({
    queryKey: ['repos'],
    queryFn: () => getRepo(),
    gcTime: Infinity,
    staleTime: Infinity,
  })
}
