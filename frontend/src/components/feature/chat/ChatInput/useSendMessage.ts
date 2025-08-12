import { useFrappePostCall, useFrappeEventListener } from 'frappe-react-sdk'
import { Message } from '../../../../../../types/Messaging/Message'
import { RavenMessage } from '@/types/RavenMessaging/RavenMessage'
import { useCallback, useState, useEffect } from 'react'
import { filesAtom } from './FileInput/useFileUpload'
import { useAtomCallback } from 'jotai/utils'

export const useSendMessage = (channelID: string, uploadFiles: (selectedMessage?: Message | null, caption?: string) => Promise<RavenMessage[]>, onMessageSent: (messages: RavenMessage[]) => void, selectedMessage?: Message | null) => {

    const { call, loading: apiLoading } = useFrappePostCall<RavenMessage & { bot_is_responding?: boolean }>('raven.api.raven_message.send_message')
    
    // Additional state to track if we're waiting for a bot response
    const [waitingForBotResponse, setWaitingForBotResponse] = useState(false)
    
    // Combined loading state that includes both API call and bot response
    const loading = apiLoading || waitingForBotResponse

    // const files = useAtomValue(filesAtom(channelID))

    const getFiles = useAtomCallback(useCallback((get) => {
        return get(filesAtom(channelID))
    }, [channelID]))

    // Listen for bot response events
    useFrappeEventListener('raven:bot_response_started', (event: { channel_id: string }) => {
        if (event.channel_id === channelID) {
            console.log('🤖 Bot response started for channel:', channelID)
            setWaitingForBotResponse(true)
        }
    })

    // Listen for bot response completion events
    useFrappeEventListener('raven:bot_response_completed', (event: { channel_id: string, success: boolean, message_id?: string }) => {
        if (event.channel_id === channelID) {
            console.log('🤖 Bot response completed for channel:', channelID, 'Success:', event.success)
            setWaitingForBotResponse(false)
        }
    })

    // Clean up bot waiting state if channel changes
    useEffect(() => {
        setWaitingForBotResponse(false)
    }, [channelID])

    const sendMessage = useCallback(async (content: string, json?: any, sendSilently: boolean = false): Promise<void> => {

        const files = getFiles()

        const hasFiles = files.length > 0

        // If we have both content and files, upload files with the content as caption
        if (content && hasFiles) {
            return uploadFiles(selectedMessage, content)
                .then((res) => {
                    onMessageSent(res)
                })
        }
        // If we only have content, send a regular text message
        else if (content) {
            return call({
                channel_id: channelID,
                text: content,
                json_content: json,
                is_reply: selectedMessage ? 1 : 0,
                linked_message: selectedMessage ? selectedMessage.name : null,
                send_silently: sendSilently ? true : false
            })
                .then((res) => {
                    onMessageSent([res])
                    
                    // If the response indicates a bot is responding, set waiting state
                    if (res.bot_is_responding) {
                        console.log('🤖 Bot is responding, blocking input until response is received')
                        setWaitingForBotResponse(true)
                    }
                })
        }
        // If we only have files, upload them without caption
        else if (hasFiles) {
            return uploadFiles(selectedMessage)
                .then((res) => {
                    onMessageSent(res)
                })
        }
        // No content and no files - do nothing
        else {
            return Promise.resolve()
        }
    }, [channelID, selectedMessage, uploadFiles, onMessageSent, call])


    return {
        sendMessage,
        loading
    }
}