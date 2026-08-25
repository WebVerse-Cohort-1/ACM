import React, { useState } from 'react';
import { Card, Text, Button, Stack, Heading, Flex } from '@sanity/ui';
import { SyncIcon } from '@sanity/icons/Sync';
import { DownloadIcon } from '@sanity/icons/Download';
import { UploadIcon } from '@sanity/icons/Upload';

const API_URL = 'http://localhost:3001';

const BackupDashboardContent = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  const handleBackup = async () => {
    setLoading(true);
    setStatus({ type: null, message: '' });
    try {
      const res = await fetch(`${API_URL}/backup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ type: 'success', message: `Backup Successful: ${data.message}` });
      } else {
        setStatus({ type: 'error', message: `Backup Failed: ${data.error}` });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Network Error: Could not connect to API server' });
    }
    setLoading(false);
  };

  const handleRestore = async () => {
    if (!window.confirm('Are you sure you want to restore? This will merge data from Google Sheets to Sanity and might overwrite existing records.')) {
      return;
    }
    setLoading(true);
    setStatus({ type: null, message: '' });
    try {
      const res = await fetch(`${API_URL}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ type: 'success', message: `Restore Successful: ${data.message}` });
      } else {
        setStatus({ type: 'error', message: `Restore Failed: ${data.error}` });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Network Error: Could not connect to API server' });
    }
    setLoading(false);
  };

  return (
    <Card padding={5}>
      <Stack space={4}>
        <Heading as="h1" size={4}>Database Backup & Restore</Heading>
        <Text size={2} muted>Sync your Sanity dataset with Google Sheets.</Text>
        
        {status.type && (
          <Card padding={3} radius={2} tone={status.type === 'success' ? 'positive' : 'critical'}>
            <Text size={2}>{status.message}</Text>
          </Card>
        )}

        <Card padding={4} radius={2} shadow={1} border>
          <Stack space={4}>
            <Heading as="h2" size={2}>Google Sheets Integration</Heading>
            <Text size={1} muted>
              Use this tool to back up all your collections to Google Sheets, or restore them from Sheets in case of data loss. The restore process will merge matching IDs and insert new rows.
            </Text>
            
            <Flex gap={3} align="center">
              <Button
                icon={UploadIcon}
                text={loading ? 'Processing...' : 'Backup to Sheets'}
                tone="primary"
                mode="default"
                onClick={handleBackup}
                disabled={loading}
              />
              <Button
                icon={DownloadIcon}
                text={loading ? 'Processing...' : 'Restore from Sheets'}
                tone="critical"
                mode="ghost"
                onClick={handleRestore}
                disabled={loading}
              />
              {loading && <SyncIcon style={{ animation: 'spin 1s linear infinite' }} />}
            </Flex>
          </Stack>
        </Card>
      </Stack>
    </Card>
  );
};

export const BackupDashboard = () => {
  return (
    <BackupDashboardContent />
  );
};
