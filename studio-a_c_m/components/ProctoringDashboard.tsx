import * as React from 'react'
import { useState, useEffect } from 'react'
import { useClient } from 'sanity'
import { 
  Container, Box, Stack, Card, Text, Heading, Button, 
  Tab, TabList, TabPanel, Badge, Flex, Grid 
} from '@sanity/ui'

export function ProctoringDashboard() {
  const client = useClient({ apiVersion: '2023-01-01' })
  
  const [activeTab, setActiveTab] = useState('approvals')
  
  // Data States
  const [registrations, setRegistrations] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch registrations
        const regData = await client.fetch(`*[_type == "registration"] | order(_createdAt desc)`)
        setRegistrations(regData)
        
        // Fetch sessions
        const sessionData = await client.fetch(`*[_type == "quizSession"] | order(_createdAt desc)`)
        setSessions(sessionData)
      } catch (err) {
        console.error("Error fetching dashboard data:", err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [client])

  // Setup Real-time listener for quiz sessions
  useEffect(() => {
    if (activeTab !== 'proctoring') return

    const query = `*[_type == "quizSession"]`
    const subscription = client.listen(query).subscribe((update: any) => {
      if (update.result) {
        // Find and replace the session or add it
        setSessions(prev => {
          const exists = prev.find(s => s._id === update.result._id)
          if (exists) {
            return prev.map(s => s._id === update.result._id ? update.result : s)
          }
          return [update.result, ...prev]
        })
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [client, activeTab])

  // Handlers
  const toggleApproval = async (id: string, currentStatus: boolean) => {
    try {
      await client.patch(id).set({ isApprovedForExam: !currentStatus }).commit()
      // Optimistic update
      setRegistrations(prev => prev.map(r => r._id === id ? { ...r, isApprovedForExam: !currentStatus } : r))
    } catch (err) {
      console.error("Failed to toggle approval", err)
      alert("Failed to update approval status.")
    }
  }

  const unlockMember = async (sessionId: string, memberName: string, members: any[]) => {
    try {
      // Find the specific member and update their status in the array
      const updatedMembers = members.map(m => {
        if (m.name === memberName) {
          return { ...m, isLocked: false, status: 'offline' } // Set to offline until they reconnect
        }
        return m
      })

      await client.patch(sessionId).set({ members: updatedMembers }).commit()
      // Optimistic update handled by listener
    } catch (err) {
      console.error("Failed to unlock member", err)
      alert("Failed to unlock member.")
    }
  }

  return (
    <Container width={3} padding={4}>
      <Stack space={5}>
        <Heading as="h1" size={5}>Live Proctoring & Management Dashboard</Heading>

        {/* @ts-ignore */}
        <TabList space={2}>
          <Tab
            aria-controls="approvals-panel"
            id="approvals-tab"
            label="Pre-Exam Approvals"
            onClick={() => setActiveTab('approvals')}
            selected={activeTab === 'approvals'}
          />
          <Tab
            aria-controls="proctoring-panel"
            id="proctoring-tab"
            label="Live Quiz Proctoring"
            onClick={() => setActiveTab('proctoring')}
            selected={activeTab === 'proctoring'}
          />
        </TabList>

        <TabPanel
          aria-labelledby="approvals-tab"
          hidden={activeTab !== 'approvals'}
          id="approvals-panel"
        >
          <Card padding={4} radius={2} shadow={1} marginY={3}>
            <Stack space={4}>
              <Heading as="h3" size={3}>Manage Registrations</Heading>
              {loading ? <Text>Loading...</Text> : (
                <Stack space={3}>
                  {registrations.map((reg: any) => (
                    <Card key={reg._id} padding={3} radius={2} border>
                      <Flex align="center" justify="space-between">
                        <Box>
                          <Text weight="semibold">{reg.team || 'No Team Name'} ({reg.branch || 'N/A'})</Text>
                          <Text size={1} muted>Event: {reg.eventSlug}</Text>
                          <Text size={1} muted>Members: {reg.members?.map((m: any) => m.name).join(', ')}</Text>
                        </Box>
                        <Button 
                          tone={reg.isApprovedForExam ? 'positive' : 'critical'} 
                          mode="ghost"
                          text={reg.isApprovedForExam ? 'Approved' : 'Pending'} 
                          onClick={() => toggleApproval(reg._id, reg.isApprovedForExam)}
                        />
                      </Flex>
                    </Card>
                  ))}
                </Stack>
              )}
            </Stack>
          </Card>
        </TabPanel>

        <TabPanel
          aria-labelledby="proctoring-tab"
          hidden={activeTab !== 'proctoring'}
          id="proctoring-panel"
        >
          <Card padding={4} radius={2} shadow={1} marginY={3}>
            <Stack space={4}>
              <Heading as="h3" size={3}>Active Quiz Sessions</Heading>
              <Text size={1} muted>Real-time overview of active quiz teams and members.</Text>
              
              {loading ? <Text>Loading...</Text> : (
                <Grid columns={[1, 1, 2]} gap={3}>
                  {sessions.map((session: any) => {
                    const hasLocked = session.members?.some((m: any) => m.isLocked)
                    
                    return (
                      <Card key={session._id} padding={3} radius={2} border tone={hasLocked ? 'critical' : 'transparent'}>
                        <Stack space={3}>
                          <Flex justify="space-between" align="center">
                            <Heading as="h4" size={2}>{session.teamName || 'Unknown Team'}</Heading>
                            <Badge tone={hasLocked ? 'critical' : 'primary'}>
                              {hasLocked ? 'Suspicious Activity' : 'Monitoring'}
                            </Badge>
                          </Flex>
                          <Text size={1} muted>Event: {session.eventSlug}</Text>
                          
                          <Stack space={2} marginTop={2}>
                            {session.members?.map((member: any, i: number) => (
                              <Flex key={i} align="center" justify="space-between" padding={2} style={{ background: 'rgba(128,128,128,0.05)', borderRadius: '4px' }}>
                                <Flex align="center" gap={2}>
                                  {/* Status Dot */}
                                  <Box 
                                    style={{ 
                                      width: 10, height: 10, borderRadius: '50%',
                                      backgroundColor: member.isLocked ? '#f43f5e' : (member.status === 'active' ? '#10b981' : '#6b7280') 
                                    }} 
                                  />
                                  <Text size={2}>{member.name}</Text>
                                </Flex>
                                
                                <Flex align="center" gap={2}>
                                  <Text size={1} muted>{member.timeRemaining ? Math.floor(member.timeRemaining / 60) + 'm' : ''}</Text>
                                  {member.isLocked && (
                                    <Button 
                                      fontSize={1} 
                                      padding={2}
                                      tone="positive" 
                                      text="Unlock Member" 
                                      onClick={() => unlockMember(session._id, member.name, session.members)}
                                    />
                                  )}
                                </Flex>
                              </Flex>
                            ))}
                          </Stack>
                        </Stack>
                      </Card>
                    )
                  })}
                </Grid>
              )}
            </Stack>
          </Card>
        </TabPanel>

      </Stack>
    </Container>
  )
}
