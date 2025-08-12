import { useFrappePostCall, useSWRConfig, useFrappeEventListener } from 'frappe-react-sdk'
import useFileUpload from '@raven/lib/hooks/useFileUpload'
import { useAtomValue } from 'jotai'
import { selectedReplyMessageAtomFamily } from '@lib/ChatInputUtils'
import { RavenMessage } from '@raven/types/RavenMessaging/RavenMessage'
import { GetMessagesResponse } from '@raven/types/common/ChatStream'
import { useState, useEffect } from 'react'

// TODO: This is older version of the useSendMessage hook compared to web, needs to be updated.
export const useSendMessage = (siteID: string, channelID: string, onSend: VoidFunction) => {

    const selectedMessage = useAtomValue(selectedReplyMessageAtomFamily(siteID + channelID))
    const { uploadFiles } = useFileUpload(siteID, channelID)
    const { call, loading: apiLoading } = useFrappePostCall('raven.api.raven_message.send_message')

    // Additional state to track if we're waiting for a bot response
    const [waitingForBotResponse, setWaitingForBotResponse] = useState(false)
    
    // Combined loading state that includes both API call and bot response
    const loading = apiLoading || waitingForBotResponse

    const onMessageSendCompleted = useOnMessageSendCompleted(channelID)

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

    const sendMessage = async (content: string, sendWithoutFiles = false, sendSilently = false): Promise<void> => {

        if (content) {

            return call({
                channel_id: channelID,
                text: content,
                is_reply: selectedMessage ? 1 : 0,
                linked_message: selectedMessage ? selectedMessage.name : null,
                send_silently: sendSilently
            })
                .then((res: any) => {
                    onMessageSendCompleted([res])
                    onSend()
                    
                    // If the response indicates a bot is responding, set waiting state
                    if (res.bot_is_responding) {
                        console.log('🤖 Bot is responding, blocking input until response is received')
                        setWaitingForBotResponse(true)
                    }
                })
                .then(() => {
                    if (!sendWithoutFiles) {
                        return uploadFiles()
                    }
                })
                .then(() => {
                    onSend()
                })
        } else {
            return uploadFiles()
                .then(() => {
                    onSend()
                })
        }
    }


    return {
        sendMessage,
        loading
    }
}

const useOnMessageSendCompleted = (channelID: string) => {
    const { mutate } = useSWRConfig()

    const onMessageSendCompleted = (messages: RavenMessage[]) => {
        // Update the messages in the cache

        mutate({ path: `get_messages_for_channel_${channelID}` }, (data?: GetMessagesResponse) => {
            if (data && data?.message.has_new_messages) {
                return data
            }

            const existingMessages = data?.message.messages ?? []

            const newMessages = [...existingMessages]

            messages.forEach(message => {
                // Check if the message is already present in the messages array
                const messageIndex = existingMessages.findIndex(m => m.name === message.name)

                if (messageIndex !== -1) {
                    // If the message is already present, update the message
                    // @ts-ignore
                    newMessages[messageIndex] = {
                        ...message,
                        _liked_by: "",
                        is_pinned: 0,
                        is_continuation: 0
                    }
                } else {
                    // If the message is not present, add the message to the array
                    // @ts-ignore
                    newMessages.push({
                        ...message,
                        _liked_by: "",
                        is_pinned: 0,
                        is_continuation: 0
                    })
                }
            })

            return {
                message: {
                    messages: newMessages.sort((a, b) => {
                        return new Date(b.creation).getTime() - new Date(a.creation).getTime()
                    }),
                    has_new_messages: false,
                    has_old_messages: data?.message.has_old_messages ?? false
                }
            }

        }, { revalidate: false })

    }

    return onMessageSendCompleted
}

