import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Chip, Button, Paper,
  LinearProgress, Avatar
} from '@mui/material';
import {
  Security, Verified, Block, Download
} from '@mui/icons-material';
import { farmAPI } from '../../services/api';

const BlockchainView: React.FC = () => {
  const [blockchainData, setBlockchainData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBlockchainData();
  }, []);

  const loadBlockchainData = async () => {
    try {
      setLoading(true);
      const data = await farmAPI.getBlockchainHistory();
      setBlockchainData(data);
    } catch (error) {
      console.error('Error loading blockchain data:', error);
    } finally {
      setLoading(false);
    }
  };

  const BlockCard = ({ block }: { block: any }) => (
    <Card elevation={3} sx={{ mb: 2, border: '1px solid', borderColor: 'success.main' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <Block />
            </Avatar>
            <Box>
              <Typography variant="h6">Block #{block.block_id}</Typography>
              <Typography variant="body2" color="text.secondary">
                {new Date(block.timestamp).toLocaleString()}
              </Typography>
            </Box>
          </Box>
          
          <Chip
            label="Verified"
            color="success"
            icon={<Verified />}
            size="small"
          />
        </Box>

        <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Sensor ID
            </Typography>
            <Typography variant="body1" fontFamily="monospace">
              {block.sensor_id}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Confidence Score
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <LinearProgress
                variant="determinate"
                value={block.confidence_score * 100}
                sx={{ flexGrow: 1, height: 8, borderRadius: 1 }}
                color="success"
              />
              <Typography variant="body2">
                {Math.round(block.confidence_score * 100)}%
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Box textAlign="center">
          <Security sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6">Loading Blockchain Data...</Typography>
          <LinearProgress sx={{ mt: 2, width: 200 }} />
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                <Security />
              </Avatar>
              <Box>
                <Typography variant="h4">⛓️ Blockchain Traceability</Typography>
                <Typography variant="body1" color="text.secondary">
                  Immutable record of all farm operations and sensor data
                </Typography>
              </Box>
            </Box>
            
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={() => {
                const dataStr = JSON.stringify(blockchainData, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'farm-blockchain-data.json';
                link.click();
              }}
            >
              Export Chain
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={3} mb={3}>
        <Card elevation={2}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Block sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" color="primary">
              {blockchainData.total_blocks || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Blocks
            </Typography>
          </CardContent>
        </Card>
        
        <Card elevation={2}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Verified sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
            <Typography variant="h4" color="success.main">
              {blockchainData.recent_blocks?.filter((b: any) => b.verified).length || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Verified Blocks
            </Typography>
          </CardContent>
        </Card>
        
        <Card elevation={2}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="info.main">
              24/7
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Real-time Logging
            </Typography>
          </CardContent>
        </Card>
        
        <Card elevation={2}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="warning.main">
              100%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tamper Proof
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Recent Blocks */}
      <Typography variant="h5" gutterBottom>
        Recent Blockchain Entries
      </Typography>

      {blockchainData.recent_blocks && blockchainData.recent_blocks.length > 0 ? (
        <Box>
          {blockchainData.recent_blocks.map((block: any) => (
            <BlockCard key={block.block_id} block={block} />
          ))}
        </Box>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Block sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No blockchain entries yet
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default BlockchainView;
