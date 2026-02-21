import { useMutation } from '@tanstack/react-query'
import { uploadImages } from '@/utils/rpc'
import { useToast } from './use-toast'

export function useUploadImages() {
  const toast = useToast()

  return useMutation<ClientUploadImagesResult, Error, File[]>({
    mutationFn: uploadImages,
    onError: error => {
      toast.critical(error.message)
    },
  })
}
