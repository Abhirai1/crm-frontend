import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';

const KanbanBoard = ({ session }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [registerApplicantDocs, setRegisterApplicantDocs] = useState(null);
  const [fileInputs, setFileInputs] = useState({
    application_form: null,
    feasibility_form: null,
    subsidy_form: null,
    plan_commissioning_form: null,
  });
  const [intentDocumentFile, setIntentDocumentFile] = useState(null);
  const [uploadingIntent, setUploadingIntent] = useState(false);
  const [commissionDocumentFile, setCommissionDocumentFile] = useState(null);
  const [uploadingCommission, setUploadingCommission] = useState(false);
  const [availableTechnicians, setAvailableTechnicians] = useState([]);
  const [installationDetails, setInstallationDetails] = useState({
    store_location: '',
    plant_installation_date: '',
    technician_count: 0,
    technicians: [], // Array of {type: 'internal'|'external', id, name, phone}
    image_uploader_technician_id: null,
  });
  const [savingInstallationDetails, setSavingInstallationDetails] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [session]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://crm-backend-zex5.onrender.com/api/tasks?employee_id=${session.employeeId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const data = await response.json();
      setTasks(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTechnicians = async () => {
    try {
      const response = await fetch('https://crm-backend-zex5.onrender.com/api/installation-technicians');
      if (!response.ok) {
        throw new Error('Failed to fetch technicians');
      }
      const data = await response.json();
      setAvailableTechnicians(data);
    } catch (err) {
      console.error('Error fetching technicians:', err);
      setAvailableTechnicians([]);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      setUpdatingTaskId(taskId);
      const response = await fetch(
        `https://crm-backend-zex5.onrender.com/api/tasks/${taskId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update task status');
      }

      // Update local state
      setTasks(
        tasks.map((task) =>
          task.task_id === taskId ? { ...task, status: newStatus } : task
        )
      );
    } catch (err) {
      console.error('Error updating task:', err);
      alert('Failed to update task status');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const getTasksByStatus = (status) => {
    return tasks.filter((task) => task.status === status);
  };

  const openTaskModal = async (task) => {
    const isSalesExec = session.role === 'Sales Executive';
    const isCompleteApplicationTask = task.work && task.work.toLowerCase().includes('complete applicant form');

    if (isSalesExec && isCompleteApplicationTask) {
      window.location.href = `/applications/${task.application_id}/edit`;
      return;
    }

    setSelectedTask(task);
    setShowModal(true);
    
    // Check if this is an installation details task for Operations Engineer
    const isInstallationTask = task.work && task.work.toLowerCase().includes('customer details');
    if (isInstallationTask && session.role === 'Operations Engineer') {
      // Fetch available technicians
      await fetchAvailableTechnicians();
    }
    
    // Check if this is a register applicant task or commission report task
    const isRegisterTask = task.work && task.work.toLowerCase().includes('register');
    const isCommissionTask = task.work && task.work.toLowerCase().includes('commissioning report');
    const isIntentTask = task.work && task.work.toLowerCase().includes('indent');
    
    if ((isRegisterTask || isCommissionTask || isIntentTask) && task.application_id) {
      // Fetch existing documents
      try {
        const response = await fetch(
          `https://crm-backend-zex5.onrender.com/api/register-applicant/${task.application_id}`
        );
        if (response.ok) {
          const docs = await response.json();
          setRegisterApplicantDocs(docs);
        } else {
          setRegisterApplicantDocs(null);
        }
      } catch (err) {
        console.error('Error fetching register applicant docs:', err);
        setRegisterApplicantDocs(null);
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTask(null);
    setRegisterApplicantDocs(null);
    setIntentDocumentFile(null);
    setCommissionDocumentFile(null);
    setFileInputs({
      application_form: null,
      feasibility_form: null,
      subsidy_form: null,
      plan_commissioning_form: null,
    });
    setInstallationDetails({
      store_location: '',
      plant_installation_date: '',
      technician_count: 0,
      technicians: [],
      image_uploader_technician_id: null,
    });
    setAvailableTechnicians([]);
  };

  const handleIntentDocumentUpload = async () => {
    if (!selectedTask || !selectedTask.application_id) {
      alert('No application selected');
      return;
    }

    if (!intentDocumentFile) {
      alert('Please select an intent document to upload');
      return;
    }

    try {
      setUploadingIntent(true);

      const formData = new FormData();
      formData.append('intent_document', intentDocumentFile);

      const response = await fetch(
        `https://crm-backend-zex5.onrender.com/api/register-applicant/${selectedTask.application_id}/intent`,
        {
          method: 'PATCH',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to upload intent document');
      }

      const result = await response.json();
      alert('Intent document uploaded successfully!');

      // Refresh the documents
      const docsResponse = await fetch(
        `https://crm-backend-zex5.onrender.com/api/register-applicant/${selectedTask.application_id}`
      );
      if (docsResponse.ok) {
        const docs = await docsResponse.json();
        setRegisterApplicantDocs(docs);
      }

      setIntentDocumentFile(null);
    } catch (err) {
      console.error('Error uploading intent document:', err);
      alert('Failed to upload intent document. Please try again.');
    } finally {
      setUploadingIntent(false);
    }
  };

  const handleCommissionDocumentUpload = async () => {
    if (!selectedTask || !selectedTask.application_id) {
      alert('No application selected');
      return;
    }

    if (!commissionDocumentFile) {
      alert('Please select a commission document to upload');
      return;
    }

    try {
      setUploadingCommission(true);

      const formData = new FormData();
      formData.append('commission_document', commissionDocumentFile);

      const response = await fetch(
        `https://crm-backend-zex5.onrender.com/api/register-applicant/${selectedTask.application_id}/commission`,
        {
          method: 'PATCH',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to upload commission document');
      }

      const result = await response.json();
      alert('Commission document uploaded successfully!');

      // Refresh the documents
      const docsResponse = await fetch(
        `https://crm-backend-zex5.onrender.com/api/register-applicant/${selectedTask.application_id}`
      );
      if (docsResponse.ok) {
        const docs = await docsResponse.json();
        setRegisterApplicantDocs(docs);
      }

      setCommissionDocumentFile(null);
    } catch (err) {
      console.error('Error uploading commission document:', err);
      alert('Failed to upload commission document. Please try again.');
    } finally {
      setUploadingCommission(false);
    }
  };

  const handleFileChange = (fieldName, file) => {
    setFileInputs(prev => ({
      ...prev,
      [fieldName]: file
    }));
  };

  const handleInstallationDetailsChange = (field, value) => {
    setInstallationDetails(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTechnicianCountChange = (count) => {
    const numCount = parseInt(count) || 0;
    const currentTechnicians = installationDetails.technicians || [];
    
    // Preserve existing technicians or create new ones
    const newTechnicians = Array.from({ length: numCount }, (_, i) => {
      return currentTechnicians[i] || {
        type: 'internal', // default to internal
        id: null,
        name: '',
        phone: '',
      };
    });
    
    setInstallationDetails(prev => ({
      ...prev,
      technician_count: numCount,
      technicians: newTechnicians,
      // Reset image uploader if no technicians
      image_uploader_technician_id: numCount > 0 ? prev.image_uploader_technician_id : null,
    }));
  };

  const handleTechnicianTypeChange = (index, type) => {
    const newTechnicians = [...installationDetails.technicians];
    newTechnicians[index] = {
      ...newTechnicians[index],
      type,
      // Reset fields when changing type
      id: type === 'internal' ? null : newTechnicians[index].id,
      name: '',
      phone: type === 'external' ? '' : newTechnicians[index].phone,
    };
    setInstallationDetails(prev => ({
      ...prev,
      technicians: newTechnicians,
    }));
  };

  const handleTechnicianSelectionChange = (index, technicianId) => {
    const newTechnicians = [...installationDetails.technicians];
    
    // If internal technician selected from dropdown
    if (technicianId) {
      const selectedTech = availableTechnicians.find(t => t.id === parseInt(technicianId));
      if (selectedTech) {
        newTechnicians[index] = {
          ...newTechnicians[index],
          id: selectedTech.id,
          name: selectedTech.name,
        };
      }
    } else {
      // Cleared selection
      newTechnicians[index] = {
        ...newTechnicians[index],
        id: null,
        name: '',
      };
    }
    
    setInstallationDetails(prev => ({
      ...prev,
      technicians: newTechnicians,
    }));
  };

  const handleExternalTechnicianChange = (index, field, value) => {
    const newTechnicians = [...installationDetails.technicians];
    newTechnicians[index] = {
      ...newTechnicians[index],
      [field]: value,
    };
    setInstallationDetails(prev => ({
      ...prev,
      technicians: newTechnicians,
    }));
  };

  const handleSaveInstallationDetails = async () => {
    if (!selectedTask || !selectedTask.application_id) {
      alert('No application selected');
      return;
    }

    if (!installationDetails.store_location) {
      alert('Please select a store location');
      return;
    }

    if (!installationDetails.plant_installation_date) {
      alert('Please select plant installation date');
      return;
    }

    // Validate technicians
    if (installationDetails.technician_count > 0) {
      const hasInvalidTechnician = installationDetails.technicians.some((tech, idx) => {
        if (tech.type === 'internal') {
          if (!tech.id || !tech.name) {
            alert(`Please select a technician for Technician ${idx + 1}`);
            return true;
          }
        } else if (tech.type === 'external') {
          if (!tech.name || !tech.phone) {
            alert(`Please enter name and phone for external Technician ${idx + 1}`);
            return true;
          }
        }
        return false;
      });

      if (hasInvalidTechnician) return;

      // Validate image uploader is selected and is internal
      if (!installationDetails.image_uploader_technician_id) {
        alert('Please select which internal technician will upload installation images');
        return;
      }

      const internalTechnicians = installationDetails.technicians.filter(t => t.type === 'internal');
      const isUploaderValid = internalTechnicians.some(t => t.id === installationDetails.image_uploader_technician_id);
      
      if (!isUploaderValid) {
        alert('Image uploader must be one of the selected internal technicians');
        return;
      }
    }

    try {
      setSavingInstallationDetails(true);

      const response = await fetch('https://crm-backend-zex5.onrender.com/api/installation-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          application_id: selectedTask.application_id,
          store_location: installationDetails.store_location,
          plant_installation_date: installationDetails.plant_installation_date,
          technician_details: installationDetails.technicians,
          image_uploader_technician_id: installationDetails.image_uploader_technician_id,
          task_id: selectedTask.task_id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save installation details');
      }

      const result = await response.json();
      alert('Installation details saved successfully! Task created for image upload technician.');

      // Update task status to in_progress locally
      setTasks(
        tasks.map((task) =>
          task.task_id === selectedTask.task_id ? { ...task, status: 'in_progress' } : task
        )
      );

      // Reset form
      setInstallationDetails({
        store_location: '',
        plant_installation_date: '',
        technician_count: 0,
        technicians: [],
        image_uploader_technician_id: null,
      });

      closeModal();
      
      // Refresh tasks to show newly created task
      await fetchTasks();
    } catch (err) {
      console.error('Error saving installation details:', err);
      alert(`Failed to save installation details: ${err.message}`);
    } finally {
      setSavingInstallationDetails(false);
    }
  };

  const handleSaveRegisterApplicantFiles = async () => {
    if (!selectedTask || !selectedTask.application_id) {
      alert('No application selected');
      return;
    }

    // Check if at least one file is selected
    const hasFiles = Object.values(fileInputs).some(file => file !== null);
    if (!hasFiles) {
      alert('Please select at least one file to upload');
      return;
    }

    try {
      setUploadingFiles(true);

      const formData = new FormData();
      formData.append('application_id', selectedTask.application_id);

      // Add files to formData
      if (fileInputs.application_form) {
        formData.append('application_form', fileInputs.application_form);
      }
      if (fileInputs.feasibility_form) {
        formData.append('feasibility_form', fileInputs.feasibility_form);
      }
      if (fileInputs.subsidy_form) {
        formData.append('subsidy_form', fileInputs.subsidy_form);
      }
      if (fileInputs.plan_commissioning_form) {
        formData.append('plan_commissioning_form', fileInputs.plan_commissioning_form);
      }

      const response = await fetch('https://crm-backend-zex5.onrender.com/api/register-applicant', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload files');
      }

      const result = await response.json();
      alert('Files uploaded successfully!');

      // Refresh the documents
      const docsResponse = await fetch(
        `https://crm-backend-zex5.onrender.com/api/register-applicant/${selectedTask.application_id}`
      );
      if (docsResponse.ok) {
        const docs = await docsResponse.json();
        setRegisterApplicantDocs(docs);
      }

      // Reset file inputs
      setFileInputs({
        application_form: null,
        feasibility_form: null,
        subsidy_form: null,
        plan_commissioning_form: null,
      });
    } catch (err) {
      console.error('Error uploading files:', err);
      alert('Failed to upload files. Please try again.');
    } finally {
      setUploadingFiles(false);
    }
  };

  const downloadProfilePDF = () => {
    if (!selectedTask || !selectedTask.applications) return;

    const app = selectedTask.applications;
    const doc = new jsPDF();

    // Set colors and fonts
    const primaryColor = [37, 99, 235]; // Blue
    const secondaryColor = [71, 85, 105]; // Slate
    const lightBg = [241, 245, 249]; // Light slate
    
    let yPos = 20;

    // Header Section
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Solar CRM Application Profile', 105, 18, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 28, { align: 'center' });

    yPos = 45;

    // Applicant Information Section
    doc.setFillColor(...lightBg);
    doc.rect(10, yPos, 190, 8, 'F');
    doc.setTextColor(...primaryColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('📋 APPLICANT INFORMATION', 15, yPos + 5.5);
    yPos += 15;

    doc.setTextColor(...secondaryColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const addField = (label, value) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label + ':', 15, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(String(value || 'N/A'), 70, yPos);
      yPos += 7;
    };

    addField('Applicant Name', app.applicant_name);
    addField('Mobile Number', app.mobile_number);
    addField('Email ID', app.email_id);
    addField('Application Status', app.application_status);
    
    yPos += 5;

    // Solar Plant Details
    doc.setFillColor(...lightBg);
    doc.rect(10, yPos, 190, 8, 'F');
    doc.setTextColor(...primaryColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('☀️ SOLAR PLANT DETAILS', 15, yPos + 5.5);
    yPos += 15;

    doc.setTextColor(...secondaryColor);
    doc.setFontSize(10);
    
    addField('Plant Type', app.solar_plant_type);
    addField('System Type', app.solar_system_type);
    addField('Plant Size (kW)', app.plant_size_kw);
    addField('Plant Price (₹)', app.plant_price);
    addField('Structure Type', app.structure_type);
    addField('Building Floor', app.building_floor_number);
    addField('Free Shadow Area', app.free_shadow_area);

    yPos += 5;

    // Location Details
    doc.setFillColor(...lightBg);
    doc.rect(10, yPos, 190, 8, 'F');
    doc.setTextColor(...primaryColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('📍 LOCATION DETAILS', 15, yPos + 5.5);
    yPos += 15;

    doc.setTextColor(...secondaryColor);
    doc.setFontSize(10);
    
    addField('District', app.district);
    addField('Pincode', app.installation_pincode);
    addField('Site Address', app.site_address);
    addField('Latitude', app.site_latitude);
    addField('Longitude', app.site_longitude);

    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    } else {
      yPos += 5;
    }

    // Payment Details
    doc.setFillColor(...lightBg);
    doc.rect(10, yPos, 190, 8, 'F');
    doc.setTextColor(...primaryColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('💳 PAYMENT DETAILS', 15, yPos + 5.5);
    yPos += 15;

    doc.setTextColor(...secondaryColor);
    doc.setFontSize(10);
    
    addField('Payment Mode', app.payment_mode);
    addField('Advance Payment Mode', app.advance_payment_mode);
    addField('UPI Type', app.upi_type);
    addField('Margin Money (₹)', app.margin_money);
    addField('Special Finance Required', app.special_finance_required);

    yPos += 5;

    // Special Requests
    doc.setFillColor(...lightBg);
    doc.rect(10, yPos, 190, 8, 'F');
    doc.setTextColor(...primaryColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('⚙️ SPECIAL REQUESTS', 15, yPos + 5.5);
    yPos += 15;

    doc.setTextColor(...secondaryColor);
    doc.setFontSize(10);
    
    addField('Name Correction Required', app.name_correction_required);
    if (app.name_correction_required === 'Required') {
      addField('Correct Name', app.correct_name);
    }
    addField('Load Enhancement Required', app.load_enhancement_required);
    if (app.load_enhancement_required === 'Required') {
      addField('Current Load (kW)', app.current_load);
      addField('Required Load (kW)', app.required_load);
    }
    addField('COT Required', app.cot_required);
    if (app.cot_required === 'Yes') {
      addField('COT Type', app.cot_type);
    }
    addField('Meter Type', app.meter_type);

    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    } else {
      yPos += 5;
    }

    // Sales Executive Details
    doc.setFillColor(...lightBg);
    doc.rect(10, yPos, 190, 8, 'F');
    doc.setTextColor(...primaryColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('👤 SALES EXECUTIVE', 15, yPos + 5.5);
    yPos += 15;

    doc.setTextColor(...secondaryColor);
    doc.setFontSize(10);
    
    addField('Executive ID', app.sales_executive_id);
    addField('Executive Name', app.sales_executive_name);

    yPos += 5;

    // Installation Details
    doc.setFillColor(...lightBg);
    doc.rect(10, yPos, 190, 8, 'F');
    doc.setTextColor(...primaryColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('📅 INSTALLATION DETAILS', 15, yPos + 5.5);
    yPos += 15;

    doc.setTextColor(...secondaryColor);
    doc.setFontSize(10);
    
    addField('Feasible Installation Date', app.installation_date_feasible ? new Date(app.installation_date_feasible).toLocaleDateString() : 'N/A');

    yPos += 10;

    // Footer
    doc.setFillColor(...primaryColor);
    doc.rect(0, 287, 210, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text('Solar CRM System - Confidential Document', 105, 293, { align: 'center' });

    // Save PDF
    doc.save(`Application_${app.applicant_name}_${app.application_id}.pdf`);
  };

  const TaskCard = ({ task }) => {
    const statusOptions = ['pending', 'in_progress', 'completed'];
    const currentStatusIndex = statusOptions.indexOf(task.status);

    return (
      <div 
        onClick={() => openTaskModal(task)}
        className="bg-white rounded-lg shadow-md p-4 mb-3 border border-slate-200 hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.02]"
      >
        {/* Applicant Name */}
        <div className="mb-3">
          <h3 className="font-semibold text-lg text-slate-800 truncate">
            {task.applicant_name}
          </h3>
          <p className="text-sm text-slate-500">{task.mobile_number}</p>
        </div>

        {/* Work Description */}
        <div className="mb-3">
          <p className="text-xs text-slate-600 font-medium mb-1">Task:</p>
          <p className="text-sm text-slate-700 leading-relaxed">
            {task.work}
          </p>
        </div>

        {/* Additional Details */}
        {task.solar_system_type && (
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
              {task.solar_system_type} {task.plant_size_kw}kW
            </span>
            {task.district && (
              <span className="inline-block px-2 py-1 bg-green-50 text-green-700 text-xs rounded">
                {task.district}
              </span>
            )}
          </div>
        )}

        {/* Status Selector */}
        <div className="pt-3 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
          <label className="text-xs text-slate-600 font-medium mb-2 block">
            Status:
          </label>
          <select
            value={task.status}
            onChange={(e) => updateTaskStatus(task.task_id, e.target.value)}
            disabled={updatingTaskId === task.task_id}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
              updatingTaskId === task.task_id
                ? 'bg-slate-100 cursor-wait'
                : 'bg-white cursor-pointer hover:border-blue-400'
            } ${
              task.status === 'pending'
                ? 'border-orange-300 text-orange-700'
                : task.status === 'in_progress'
                ? 'border-blue-300 text-blue-700'
                : 'border-green-300 text-green-700'
            }`}
          >
            <option value="pending">🟠 Pending</option>
            <option value="in_progress">🔵 In Progress</option>
            <option value="completed">🟢 Completed</option>
          </select>
        </div>

        {/* Timestamp */}
        <div className="mt-2 text-xs text-slate-400">
          Created: {new Date(task.task_created_at).toLocaleDateString()}
        </div>
      </div>
    );
  };

  const KanbanColumn = ({ title, status, color, icon }) => {
    const columnTasks = getTasksByStatus(status);

    return (
      <div
        className="flex-1 min-w-[90vw] md:min-w-0 snap-center px-2 md:px-0"
        style={{ maxWidth: '100%', boxSizing: 'border-box' }}
      >
        <div className={`bg-gradient-to-br ${color} rounded-lg shadow-sm p-4 mb-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{icon}</span>
              <h2 className="font-bold text-white text-lg">{title}</h2>
            </div>
            <span className="bg-white/30 text-white font-semibold px-3 py-1 rounded-full text-sm">
              {columnTasks.length}
            </span>
          </div>
        </div>

        <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-2 custom-scrollbar">
          {columnTasks.length === 0 ? (
            <div className="bg-slate-50 rounded-lg p-6 text-center border-2 border-dashed border-slate-200">
              <p className="text-slate-400 text-sm">No tasks</p>
            </div>
          ) : (
            columnTasks.map((task) => (
              <TaskCard key={task.task_id} task={task} />
            ))
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
          <div className="text-red-600 mb-4">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 text-center mb-2">
            Error Loading Tasks
          </h3>
          <p className="text-slate-600 text-center mb-4">{error}</p>
          <button
            onClick={fetchTasks}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      {/* Task Detail Modal */}
      {showModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-2xl">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Task Details
                  </h2>
                  <p className="text-blue-100 text-sm">
                    Application #{selectedTask.application_id}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Check if this is a register applicant task for System Admin */}
              {session.role === 'System Admin' && selectedTask.work && selectedTask.work.toLowerCase().includes('register') ? (
                <>
                  {/* Applicant Info */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
                      <span className="text-2xl mr-2">👤</span>
                      Applicant Information
                    </h3>
                    <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                      <div className="flex items-center">
                        <span className="text-slate-600 font-medium w-32">Name:</span>
                        <span className="text-slate-800 font-semibold">
                          {selectedTask.applications?.applicant_name || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-slate-600 font-medium w-32">Mobile:</span>
                        <span className="text-slate-800 font-semibold">
                          {selectedTask.applications?.mobile_number || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-slate-600 font-medium w-32">Email:</span>
                        <span className="text-slate-800 text-sm">
                          {selectedTask.applications?.email_id || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Task Info */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
                      <span className="text-2xl mr-2">📋</span>
                      Task Description
                    </h3>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-slate-700">{selectedTask.work}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          selectedTask.status === 'pending'
                            ? 'bg-orange-100 text-orange-700'
                            : selectedTask.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {selectedTask.status === 'pending' ? '🟠 Pending' : 
                           selectedTask.status === 'in_progress' ? '🔵 In Progress' : '🟢 Completed'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* File Upload Section */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
                      <span className="text-2xl mr-2">📄</span>
                      Upload Registration Documents
                    </h3>
                    <div className="space-y-4">
                      {/* Application Form */}
                      <div className="bg-slate-50 rounded-lg p-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Application Form
                        </label>
                        <input
                          type="file"
                          onChange={(e) => handleFileChange('application_form', e.target.files[0])}
                          className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                        />
                        {registerApplicantDocs?.application_form_url && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs text-green-600">✓ Uploaded</span>
                            <a 
                              href={`https://crm-backend-zex5.onrender.com${registerApplicantDocs.application_form_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline"
                            >
                              View File
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Feasibility Form */}
                      <div className="bg-slate-50 rounded-lg p-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Feasibility Form
                        </label>
                        <input
                          type="file"
                          onChange={(e) => handleFileChange('feasibility_form', e.target.files[0])}
                          className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                        />
                        {registerApplicantDocs?.feasibility_form_url && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs text-green-600">✓ Uploaded</span>
                            <a 
                              href={`https://crm-backend-zex5.onrender.com${registerApplicantDocs.feasibility_form_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline"
                            >
                              View File
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Subsidy Form */}
                      <div className="bg-slate-50 rounded-lg p-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Subsidy Form
                        </label>
                        <input
                          type="file"
                          onChange={(e) => handleFileChange('subsidy_form', e.target.files[0])}
                          className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                        />
                        {registerApplicantDocs?.subsidy_form_url && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs text-green-600">✓ Uploaded</span>
                            <a 
                              href={`https://crm-backend-zex5.onrender.com${registerApplicantDocs.subsidy_form_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline"
                            >
                              View File
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Plan Commissioning Form */}
                      <div className="bg-slate-50 rounded-lg p-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Plan Commissioning Form
                        </label>
                        <input
                          type="file"
                          onChange={(e) => handleFileChange('plan_commissioning_form', e.target.files[0])}
                          className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                        />
                        {registerApplicantDocs?.plan_commissioning_form_url && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs text-green-600">✓ Uploaded</span>
                            <a 
                              href={`https://crm-backend-zex5.onrender.com${registerApplicantDocs.plan_commissioning_form_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline"
                            >
                              View File
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveRegisterApplicantFiles}
                      disabled={uploadingFiles}
                      className={`flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3 ${
                        uploadingFiles ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {uploadingFiles ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Save Files</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={downloadProfilePDF}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Download Details</span>
                    </button>
                  </div>
                </>
              ) : session.role === 'System Admin' && selectedTask.work && selectedTask.work.toLowerCase().includes('indent') ? (
                <>
                  {/* Hard Copy Indent Creation Task UI */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
                      <span className="text-2xl mr-2">📋</span>
                      Hard Copy Indent
                    </h3>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-slate-700 mb-4">{selectedTask.work}</p>
                    </div>
                  </div>

                  {/* Intent Document Upload */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
                      <span className="text-2xl mr-2">📄</span>
                      Upload Intent Document
                    </h3>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <label className="block text-sm font-medium text-slate-700 mb-3">
                        Intent Document
                      </label>
                      <input
                        type="file"
                        onChange={(e) => setIntentDocumentFile(e.target.files[0])}
                        className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                      />
                      {registerApplicantDocs?.intent_document_url && (
                        <div className="mt-3 flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                          <span className="text-xs text-green-600 font-semibold">✓ Uploaded</span>
                          <a 
                            href={`https://crm-backend-zex5.onrender.com${registerApplicantDocs.intent_document_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            View Document
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Upload Button */}
                  <button
                    onClick={handleIntentDocumentUpload}
                    disabled={uploadingIntent || !intentDocumentFile}
                    className={`w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3 ${
                      (uploadingIntent || !intentDocumentFile) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {uploadingIntent ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Upload Intent Document</span>
                      </>
                    )}
                  </button>
                </>
              ) : session.role === 'System Admin' && selectedTask.work && selectedTask.work.toLowerCase().includes('commissioning report') ? (
                <>
                  {/* Commissioning Report Upload Task UI */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
                      <span className="text-2xl mr-2">📋</span>
                      Upload Commissioning Report
                    </h3>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-slate-700 mb-4">{selectedTask.work}</p>
                    </div>
                  </div>

                  {/* Commission Document Upload */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
                      <span className="text-2xl mr-2">📄</span>
                      Upload Commission Document
                    </h3>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <label className="block text-sm font-medium text-slate-700 mb-3">
                        Commission Document
                      </label>
                      <input
                        type="file"
                        onChange={(e) => setCommissionDocumentFile(e.target.files[0])}
                        className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                      />
                      {registerApplicantDocs?.commission_doc_url && (
                        <div className="mt-3 flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                          <span className="text-xs text-green-600 font-semibold">✓ Uploaded</span>
                          <a 
                            href={`https://crm-backend-zex5.onrender.com${registerApplicantDocs.commission_doc_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            View Document
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Upload Button */}
                  <button
                    onClick={handleCommissionDocumentUpload}
                    disabled={uploadingCommission || !commissionDocumentFile}
                    className={`w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3 ${
                      (uploadingCommission || !commissionDocumentFile) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {uploadingCommission ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Upload Commission Document</span>
                      </>
                    )}
                  </button>
                </>
              ) : session.role === 'Operations Engineer' && selectedTask.work && selectedTask.work.toLowerCase().includes('customer details') ? (
                <>
                  {/* Installation Details Form for Operations Engineer */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
                      <span className="text-2xl mr-2">🏗️</span>
                      Installation Details
                    </h3>
                  </div>

                  {/* Store Location Dropdown */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Store Location *
                    </label>
                    <select
                      value={installationDetails.store_location}
                      onChange={(e) => handleInstallationDetailsChange('store_location', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Store Location</option>
                      <option value="Ghazipur">Ghazipur</option>
                      <option value="Varanasi">Varanasi</option>
                      <option value="Mau">Mau</option>
                      <option value="Azamgarh">Azamgarh</option>
                      <option value="Ballia">Ballia</option>
                    </select>
                  </div>

                  {/* Plant Installation Date */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Plant Installation Date *
                    </label>
                    <input
                      type="date"
                      value={installationDetails.plant_installation_date}
                      onChange={(e) => handleInstallationDetailsChange('plant_installation_date', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Technician Count */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Number of Technicians *
                    </label>
                    <select
                      value={installationDetails.technician_count}
                      onChange={(e) => handleTechnicianCountChange(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <option key={num} value={num}>
                          {num} Technician{num !== 1 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Technician Details */}
                  {installationDetails.technician_count > 0 && (
                    <div className="mb-6 bg-slate-50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-slate-800 mb-4">Technician Details</h4>
                      <div className="space-y-4">
                        {installationDetails.technicians.map((tech, index) => (
                          <div key={index} className="bg-white rounded-lg p-4 border border-slate-200">
                            <div className="flex items-center justify-between mb-3">
                              <label className="text-sm font-semibold text-slate-700">
                                Technician {index + 1}
                              </label>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleTechnicianTypeChange(index, 'internal')}
                                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                    tech.type === 'internal'
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                  }`}
                                >
                                  Internal
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleTechnicianTypeChange(index, 'external')}
                                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                    tech.type === 'external'
                                      ? 'bg-orange-600 text-white'
                                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                  }`}
                                >
                                  External
                                </button>
                              </div>
                            </div>

                            {tech.type === 'internal' ? (
                              <div>
                                <label className="block text-xs font-medium text-slate-700 mb-2">
                                  Select Technician *
                                </label>
                                <select
                                  value={tech.id || ''}
                                  onChange={(e) => handleTechnicianSelectionChange(index, e.target.value)}
                                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">-- Select from Organization --</option>
                                  {availableTechnicians.map((availTech) => (
                                    <option key={availTech.id} value={availTech.id}>
                                      {availTech.name} {availTech.district ? `(${availTech.district})` : ''}
                                    </option>
                                  ))}
                                </select>
                                {tech.id && tech.name && (
                                  <p className="mt-2 text-xs text-green-600 font-medium">
                                    ✓ Selected: {tech.name}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-xs font-medium text-slate-700 mb-2">
                                    Technician Name *
                                  </label>
                                  <input
                                    type="text"
                                    value={tech.name}
                                    onChange={(e) => handleExternalTechnicianChange(index, 'name', e.target.value)}
                                    placeholder="Enter technician name"
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-slate-700 mb-2">
                                    Mobile Number *
                                  </label>
                                  <input
                                    type="tel"
                                    value={tech.phone}
                                    onChange={(e) => handleExternalTechnicianChange(index, 'phone', e.target.value)}
                                    placeholder="Enter 10-digit mobile number"
                                    pattern="[0-9]{10}"
                                    maxLength="10"
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Image Uploader Selection */}
                      {installationDetails.technicians.some(t => t.type === 'internal' && t.id) && (
                        <div className="mt-6 pt-4 border-t border-slate-200">
                          <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center">
                            <span className="text-lg mr-2">📸</span>
                            Who will upload installation images?
                          </h4>
                          <p className="text-xs text-slate-600 mb-3">
                            Select one internal technician who will upload Solar Panel, Inverter, and Logger images.
                          </p>
                          <select
                            value={installationDetails.image_uploader_technician_id || ''}
                            onChange={(e) => setInstallationDetails(prev => ({
                              ...prev,
                              image_uploader_technician_id: e.target.value ? parseInt(e.target.value) : null
                            }))}
                            className="w-full px-3 py-2 text-sm border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-green-50"
                          >
                            <option value="">-- Select Image Uploader --</option>
                            {installationDetails.technicians
                              .filter(t => t.type === 'internal' && t.id)
                              .map((tech, idx) => (
                                <option key={tech.id} value={tech.id}>
                                  {tech.name} (Technician {installationDetails.technicians.indexOf(tech) + 1})
                                </option>
                              ))}
                          </select>
                          {installationDetails.image_uploader_technician_id && (
                            <div className="mt-2 p-2 bg-green-100 rounded text-xs text-green-700">
                              ✓ A task will be created for this technician to upload images
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    onClick={handleSaveInstallationDetails}
                    disabled={savingInstallationDetails}
                    className={`w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3 ${
                      savingInstallationDetails ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {savingInstallationDetails ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Save Installation Details</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  {/* Original Modal Content for other tasks */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
                  <span className="text-2xl mr-2">👤</span>
                  Applicant Information
                </h3>
                <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center">
                    <span className="text-slate-600 font-medium w-32">Name:</span>
                    <span className="text-slate-800 font-semibold">
                      {selectedTask.applications?.applicant_name || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-slate-600 font-medium w-32">Mobile:</span>
                    <span className="text-slate-800 font-semibold">
                      {selectedTask.applications?.mobile_number || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-slate-600 font-medium w-32">Email:</span>
                    <span className="text-slate-800 text-sm">
                      {selectedTask.applications?.email_id || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Task Info */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
                  <span className="text-2xl mr-2">📋</span>
                  Task Description
                </h3>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-slate-700">{selectedTask.work}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      selectedTask.status === 'pending'
                        ? 'bg-orange-100 text-orange-700'
                        : selectedTask.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {selectedTask.status === 'pending' ? '🟠 Pending' : 
                       selectedTask.status === 'in_progress' ? '🔵 In Progress' : '🟢 Completed'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Plant Details */}
              {selectedTask.applications && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
                    <span className="text-2xl mr-2">☀️</span>
                    Solar Plant Details
                  </h3>
                  <div className="bg-green-50 rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">System Type:</span>
                      <span className="text-slate-800 font-medium">
                        {selectedTask.applications.solar_system_type || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Plant Size:</span>
                      <span className="text-slate-800 font-medium">
                        {selectedTask.applications.plant_size_kw || 'N/A'} kW
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">District:</span>
                      <span className="text-slate-800 font-medium">
                        {selectedTask.applications.district || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Download Button */}
              <button
                onClick={downloadProfilePDF}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3 group"
              >
                <svg 
                  className="w-6 h-6 group-hover:scale-110 transition-transform" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Download Complete Profile (PDF)</span>
              </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
          My Tasks
        </h1>
        <p className="text-slate-600">
          Welcome back, <span className="font-semibold">{session.name}</span>!
          You have <span className="font-semibold">{tasks.length}</span> task
          {tasks.length !== 1 ? 's' : ''} assigned to you.
        </p>
      </div>

      {/* Kanban Board */}
      <div
        className="flex md:flex-row flex-nowrap md:gap-6 gap-0 pb-6 overflow-x-auto custom-scrollbar snap-x snap-mandatory"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <KanbanColumn
          title="Pending"
          status="pending"
          color="from-orange-500 to-orange-600"
          icon="🟠"
        />
        <KanbanColumn
          title="In Progress"
          status="in_progress"
          color="from-blue-500 to-blue-600"
          icon="🔵"
        />
        <KanbanColumn
          title="Completed"
          status="completed"
          color="from-green-500 to-green-600"
          icon="🟢"
        />
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default KanbanBoard;
