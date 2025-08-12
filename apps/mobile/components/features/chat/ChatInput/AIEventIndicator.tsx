import SpinningLoader from '@components/layout/SpinningLoader'
import { Text } from '@components/nativewindui/Text'
import { useFrappeEventListener } from 'frappe-react-sdk'
import { useEffect, useState } from 'react'
import Animated, {
    FadeOutDown,
    FadeInDown
} from 'react-native-reanimated'

type Props = {
    channelID: string
}

const AIEventIndicator = ({ channelID }: Props) => {
    const [aiEvent, setAIEvent] = useState("")
    const [showAIEvent, setShowAIEvent] = useState(false)
    const [waitingForBotResponse, setWaitingForBotResponse] = useState(false)

    useFrappeEventListener("ai_event", (data) => {
        if (data.channel_id === channelID) {
            setAIEvent(data.text)
            setShowAIEvent(true)
        }
    })

    useFrappeEventListener("ai_event_clear", (data) => {
        if (data.channel_id === channelID) {
            setAIEvent("")
        }
    })

    // Listen for bot response events
    useFrappeEventListener('raven:bot_response_started', (event: { channel_id: string }) => {
        if (event.channel_id === channelID) {
            console.log('🤖 Bot response started for channel:', channelID)
            setWaitingForBotResponse(true)
            setAIEvent("🤖 Freightify AI is thinking...")
            setShowAIEvent(true)
        }
    })

    useFrappeEventListener('raven:bot_response_completed', (event: { channel_id: string, success: boolean, message_id?: string }) => {
        if (event.channel_id === channelID) {
            console.log('🤖 Bot response completed for channel:', channelID, 'Success:', event.success)
            setWaitingForBotResponse(false)
            setAIEvent("")
        }
    })

    useEffect(() => {
        if (!aiEvent) {
            setTimeout(() => {
                setShowAIEvent(false)
            }, 300)
        }
    }, [aiEvent])

    // Clean up bot waiting state if channel changes
    useEffect(() => {
        setWaitingForBotResponse(false)
        setAIEvent("")
        setShowAIEvent(false)
    }, [channelID])

    if (!showAIEvent) return null

    return (
        <Animated.View
            className='flex flex-row gap-2 px-4 pt-1 items-center bg-background'
            entering={FadeInDown}
            exiting={FadeOutDown}>
            <SpinningLoader size={20} />
            <Text className={`text-base ${waitingForBotResponse ? 'text-blue-500' : 'text-muted-foreground'}`}>
                {aiEvent}
            </Text>
        </Animated.View>
    )
}

export default AIEventIndicator