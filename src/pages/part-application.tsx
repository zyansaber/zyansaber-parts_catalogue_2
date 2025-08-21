import React, { useState } from 'react';
import { FileText, Download, Plus, Eye, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { TranslationService } from '@/services/translation';
import { PDFService } from '@/services/pdf';

interface PartApplication {
  ticketId: string;
  requestedBy: string;
  department: string;
  priority: 'low' | 'medium' | 'high';
  quantity: string;
  specifications: string;
  supplier: string;
  estimatedCost: string;
  deliveryDate: string;
  notes: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export default function PartApplicationPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applications, setApplications] = useState<PartApplication[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Form state - English form
  const [formData, setFormData] = useState({
    requestedBy: '',
    department: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    quantity: '',
    specifications: '',
    supplier: '',
    estimatedCost: '',
    deliveryDate: '',
    notes: ''
  });

  // Generate next ticket ID
  const generateTicketId = () => {
    const nextNumber = applications.length + 1;
    return `Part${nextNumber.toString().padStart(2, '0')}`;
  };

  const resetForm = () => {
    setFormData({
      requestedBy: '',
      department: '',
      priority: 'medium',
      quantity: '',
      specifications: '',
      supplier: '',
      estimatedCost: '',
      deliveryDate: '',
      notes: ''
    });
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.requestedBy || !formData.department || !formData.quantity || !formData.specifications) {
      showMessage('error', 'Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate single application with ticket ID
      const ticketId = generateTicketId();
      const newApplication: PartApplication = {
        ...formData,
        ticketId,
        submittedAt: new Date().toISOString(),
        status: 'pending'
      };

      // Add to applications list
      setApplications(prev => [...prev, newApplication]);

      showMessage('success', `Part application ${ticketId} submitted successfully!`);
      resetForm();

    } catch (error) {
      console.error('Error submitting application:', error);
      showMessage('error', 'Failed to submit part application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadPDF = async (application: PartApplication) => {
    try {
      setIsSubmitting(true);
      
      // Convert to the expected PartApplication format from types/index.ts
      const pdfApplication = {
        ticket_id: application.ticketId,
        supplier_name: application.supplier || 'N/A',
        part_description: application.specifications,
        part_number: `APP-${application.ticketId}`, // Generate part number from ticket ID
        requested_by: application.requestedBy,
        department: application.department,
        urgency: application.priority,
        technical_specs: application.specifications,
        application_notes: application.notes,
        estimated_cost: parseFloat(application.estimatedCost) || 0,
        justification: 'Part application request', // Default justification
        status: application.status,
        created_at: new Date(application.submittedAt).getTime()
      };

      await PDFService.generateApplicationPDF(pdfApplication, 'zh');
      showMessage('success', 'PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showMessage('error', 'Failed to generate PDF');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Part Application</h1>
        <p className="text-gray-600 mt-1">Submit requests for new automotive parts</p>
      </div>

      {/* Message Alert */}
      {message && (
        <Alert className={message.type === 'success' ? 'border-green-500' : 'border-red-500'}>
          <AlertDescription className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Application Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>New Part Application</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="requestedBy">Requested By *</Label>
                    <Input
                      id="requestedBy"
                      value={formData.requestedBy}
                      onChange={(e) => setFormData(prev => ({ ...prev, requestedBy: e.target.value }))}
                      placeholder="Enter your name"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="department">Department *</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                      placeholder="Enter department"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={formData.priority} onValueChange={(value: 'low' | 'medium' | 'high') => 
                      setFormData(prev => ({ ...prev, priority: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                      placeholder="Enter quantity"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="estimatedCost">Estimated Cost</Label>
                    <Input
                      id="estimatedCost"
                      value={formData.estimatedCost}
                      onChange={(e) => setFormData(prev => ({ ...prev, estimatedCost: e.target.value }))}
                      placeholder="Enter cost estimate"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="specifications">Specifications *</Label>
                  <Textarea
                    id="specifications"
                    value={formData.specifications}
                    onChange={(e) => setFormData(prev => ({ ...prev, specifications: e.target.value }))}
                    placeholder="Describe the part specifications and requirements"
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="supplier">Preferred Supplier</Label>
                    <Input
                      id="supplier"
                      value={formData.supplier}
                      onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                      placeholder="Enter supplier name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="deliveryDate">Required Delivery Date</Label>
                    <Input
                      id="deliveryDate"
                      type="date"
                      value={formData.deliveryDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, deliveryDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any additional information or special requirements"
                    rows={2}
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Submit Application
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Application List */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Application List</span>
                <Badge variant="secondary">{applications.length} applications</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No applications yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.map((app) => (
                    <div key={app.ticketId} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-mono text-sm font-bold text-blue-600">
                          {app.ticketId}
                        </div>
                        <Badge variant="outline" className={getStatusColor(app.status)}>
                          {app.status}
                        </Badge>
                      </div>
                      
                      <div className="text-xs text-gray-600">
                        <p><strong>Requested by:</strong> {app.requestedBy}</p>
                        <p><strong>Department:</strong> {app.department}</p>
                        <p><strong>Quantity:</strong> {app.quantity}</p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className={getPriorityColor(app.priority)}>
                          {app.priority} priority
                        </Badge>
                        
                        <div className="flex space-x-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Application Details - {app.ticketId}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div><strong>Requested by:</strong> {app.requestedBy}</div>
                                  <div><strong>Department:</strong> {app.department}</div>
                                  <div><strong>Priority:</strong> {app.priority}</div>
                                  <div><strong>Quantity:</strong> {app.quantity}</div>
                                  <div><strong>Supplier:</strong> {app.supplier || 'N/A'}</div>
                                  <div><strong>Cost:</strong> {app.estimatedCost || 'N/A'}</div>
                                </div>
                                <div><strong>Specifications:</strong> {app.specifications}</div>
                                {app.notes && <div><strong>Notes:</strong> {app.notes}</div>}
                                <div className="text-xs text-gray-500">
                                  Submitted: {new Date(app.submittedAt).toLocaleString()}
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => downloadPDF(app)}
                            disabled={isSubmitting}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}