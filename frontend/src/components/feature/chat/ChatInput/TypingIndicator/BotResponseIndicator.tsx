import { useFrappeEventListener } from 'frappe-react-sdk'
import { useState, useEffect } from 'react'
import { Text } from '@radix-ui/themes'
import { HStack } from '@/components/layout/Stack'
import { Loader } from '@/components/common/Loader'

type Props = {
    channel: string
}

const BotResponseIndicator = ({ channel }: Props) => {
    const [waitingForBotResponse, setWaitingForBotResponse] = useState(false)

    // Listen for bot response completion events
    useFrappeEventListener('raven:bot_response_completed', (event: { channel_id: string, success: boolean, message_id?: string }) => {
        if (event.channel_id === channel) {
            console.log('🤖 Bot response completed for channel:', channel, 'Success:', event.success)
            setWaitingForBotResponse(false)
        }
    })

    // Listen for when a bot starts responding (we can emit this from the backend when thinking message is sent)
    useFrappeEventListener('raven:bot_response_started', (event: { channel_id: string }) => {
        if (event.channel_id === channel) {
            console.log('🤖 Bot response started for channel:', channel)
            setWaitingForBotResponse(true)
        }
    })

    // Clean up bot waiting state if channel changes
    useEffect(() => {
        setWaitingForBotResponse(false)
    }, [channel])

    if (!waitingForBotResponse) return null

    return (
        <HStack className='gap-1.5 pl-0.5 pt-1 relative sm:bottom-0 bottom-16 sm:pb-0 pb-2' align='center'>
            <Loader size='sm' />
            <Text size={'1'} as='span' className="text-blue-500">🤖 Freightify AI is thinking...</Text>
        </HStack>
    )
}

export default BotResponseIndicator
