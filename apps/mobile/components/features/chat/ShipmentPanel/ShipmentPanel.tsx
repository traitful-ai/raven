import { View, Text } from 'react-native'

interface ShipmentPanelProps {
    channelID: string
}

export const ShipmentPanel = ({ channelID }: ShipmentPanelProps) => {
    return (
        <View 
            className="mx-2 my-2 p-4 border border-blue-300 rounded-lg bg-blue-50"
            style={{
                borderColor: '#93C5FD',
                backgroundColor: '#EFF6FF'
            }}
        >
            <Text 
                className="text-lg font-bold text-blue-700 mb-2"
                style={{
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: '#1D4ED8',
                    marginBottom: 8
                }}
            >
                SHIPMENT PANEL
            </Text>
            <Text 
                className="text-sm text-blue-600"
                style={{
                    fontSize: 14,
                    color: '#2563EB'
                }}
            >
                Channel: {channelID}
            </Text>
        </View>
    )
}
