import { ArrowRight, UploadCloud } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function EmptyState({ title, description, actionLabel = 'Analyze a clip', actionTo = '/analyze?mode=quick' }: { title: string; description: string; actionLabel?: string; actionTo?: string }) {
  return (
    <Card className="mx-auto max-w-2xl overflow-hidden">
      <CardContent className="p-8 text-center">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-3xl bg-spike/10 text-spike">
          <UploadCloud className="h-7 w-7" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-primary">{title}</h2>
        <p className="mx-auto mt-3 max-w-xl text-secondary">{description}</p>
        {actionTo ? (
          <Button asChild className="mt-6">
            <Link to={actionTo}>
              {actionLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
