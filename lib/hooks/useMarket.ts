import { useQuery } from '@tanstack/react-query'

export function useMarket() {
  return useQuery({
    queryKey: ['market'],
    queryFn: async () => {
      // Por ahora retornar datos mock
      // TODO: Fetch real data from blockchain
      return {
        markPriceCents: 26922,
        totalOiLong: 0,
        totalOiShort: 0,
      }
    },
    refetchInterval: 30000,
  })
}
