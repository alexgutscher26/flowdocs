import 'dotenv/config'

const BASE_URL = 'http://localhost:3000'

// Mock session - in real testing you'd get this from auth
const TEST_WORKSPACE_ID = 'test-workspace-id'

async function testChannelAPI() {
    console.log('Testing Chat API Endpoints...\n')

    try {
        // Test 1: Create Channel
        console.log('1. Creating channel...')
        const createResponse = await fetch(
            `${BASE_URL}/api/chat/${TEST_WORKSPACE_ID}/channels`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: 'test-channel',
                    description: 'A test channel',
                    type: 'PUBLIC',
                }),
            }
        )

        if (!createResponse.ok) {
            console.error('Failed to create channel:', await createResponse.text())
            return
        }

        const channel = await createResponse.json()
        console.log('✓ Channel created:', channel.id)

        // Test 2: List Channels
        console.log('\n2. Listing channels...')
        const listResponse = await fetch(
            `${BASE_URL}/api/chat/${TEST_WORKSPACE_ID}/channels`
        )

        if (!listResponse.ok) {
            console.error('Failed to list channels:', await listResponse.text())
            return
        }

        const channels = await listResponse.json()
        console.log(`✓ Found ${channels.length} channel(s)`)

        // Test 3: Get Channel Details
        console.log('\n3. Getting channel details...')
        const detailResponse = await fetch(
            `${BASE_URL}/api/chat/${TEST_WORKSPACE_ID}/channels/${channel.id}`
        )

        if (!detailResponse.ok) {
            console.error('Failed to get channel:', await detailResponse.text())
            return
        }

        const channelDetails = await detailResponse.json()
        console.log('✓ Channel details retrieved:', channelDetails.name)

        // Test 4: Send Message
        console.log('\n4. Sending message...')
        const messageResponse = await fetch(
            `${BASE_URL}/api/chat/${TEST_WORKSPACE_ID}/channels/${channel.id}/messages`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: 'Hello from test script!',
                }),
            }
        )

        if (!messageResponse.ok) {
            console.error('Failed to send message:', await messageResponse.text())
            return
        }

        const message = await messageResponse.json()
        console.log('✓ Message sent:', message.id)

        // Test 5: List Messages
        console.log('\n5. Listing messages...')
        const messagesResponse = await fetch(
            `${BASE_URL}/api/chat/${TEST_WORKSPACE_ID}/channels/${channel.id}/messages`
        )

        if (!messagesResponse.ok) {
            console.error('Failed to list messages:', await messagesResponse.text())
            return
        }

        const messagesData = await messagesResponse.json()
        console.log(`✓ Found ${messagesData.messages.length} message(s)`)

        // Test 6: Update Channel
        console.log('\n6. Updating channel...')
        const updateResponse = await fetch(
            `${BASE_URL}/api/chat/${TEST_WORKSPACE_ID}/channels/${channel.id}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: 'updated-test-channel',
                    description: 'Updated description',
                }),
            }
        )

        if (!updateResponse.ok) {
            console.error('Failed to update channel:', await updateResponse.text())
            return
        }

        const updatedChannel = await updateResponse.json()
        console.log('✓ Channel updated:', updatedChannel.name)

        // Test 7: Delete Channel
        console.log('\n7. Deleting channel...')
        const deleteResponse = await fetch(
            `${BASE_URL}/api/chat/${TEST_WORKSPACE_ID}/channels/${channel.id}`,
            {
                method: 'DELETE',
            }
        )

        if (!deleteResponse.ok) {
            console.error('Failed to delete channel:', await deleteResponse.text())
            return
        }

        console.log('✓ Channel deleted')

        console.log('\n✅ All tests passed!')
    } catch (error) {
        console.error('Test failed:', error)
    }
}

testChannelAPI()
