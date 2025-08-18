import { Box, Text } from '@radix-ui/themes'
import { Stack } from '@/components/layout/Stack'

interface ShipmentPanelProps {
    channelID: string
}

export const ShipmentPanel = ({ channelID }: ShipmentPanelProps) => {
    return (
        <Box 
            className="m-2 p-4 border border-blue-300 rounded-lg bg-blue-50 dark:bg-blue-950/20 dark:border-blue-700"
        >
            <Stack gap="3">
                <Text size="4" weight="bold" className="text-blue-700 dark:text-blue-400">
                    SHIPMENT PANEL
                </Text>
                <Text size="2" className="text-blue-600 dark:text-blue-300">
                    Channel: {channelID}
                </Text>
            </Stack>
        </Box>
    )
}
