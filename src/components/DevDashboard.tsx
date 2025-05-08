
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Server, Upload } from 'lucide-react';
import DataImporter from './DataImporter';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface DevDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const DevDashboard = ({ isOpen, onClose }: DevDashboardProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Server className="h-5 w-5" /> Developer Dashboard
          </DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto pr-2 max-h-[calc(80vh-120px)]">
          <Tabs defaultValue="import" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="import">
                <Upload className="h-4 w-4 mr-2" />
                Data Import
              </TabsTrigger>
              <TabsTrigger value="database">
                <Database className="h-4 w-4 mr-2" />
                Database
              </TabsTrigger>
            </TabsList>

            <TabsContent value="import" className="pt-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Import Emergency Services Data</CardTitle>
                  <CardDescription>
                    Upload JSON files containing emergency service data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DataImporter />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="database" className="pt-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Database Management</CardTitle>
                  <CardDescription>
                    View and manage database records
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Database management features can be added here in the future.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DevDashboard;
