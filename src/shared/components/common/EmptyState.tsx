import { Card, CardContent } from '@/shared/components/ui/card'

/** Was copy-pasted as a Card > CardContent > centered muted paragraph 7 times. */
export function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="py-10 text-center text-sm text-muted-foreground">{message}</CardContent>
    </Card>
  )
}
