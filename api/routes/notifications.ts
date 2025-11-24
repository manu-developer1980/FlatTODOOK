import { Router } from 'express';
import { EmailService } from '../services/emailService';
import { PushNotificationService } from '../services/pushNotificationService';

const router = Router();
const emailService = new EmailService();
const pushService = new PushNotificationService();

// Email notification endpoints
router.post('/email/medication-reminder', async (req, res) => {
  try {
    const { userId, medicationName, dosage, time } = req.body;
    
    if (!userId || !medicationName || !dosage || !time) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, medicationName, dosage, time' 
      });
    }

    const success = await emailService.sendMedicationReminder(
      userId,
      medicationName,
      dosage,
      time
    );

    res.json({ success, message: success ? 'Email sent successfully' : 'Failed to send email' });
  } catch (error) {
    console.error('Error in medication reminder endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/email/appointment-reminder', async (req, res) => {
  try {
    const { userId, appointmentDetails } = req.body;
    
    if (!userId || !appointmentDetails) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, appointmentDetails' 
      });
    }

    const success = await emailService.sendAppointmentReminder(
      userId,
      appointmentDetails
    );

    res.json({ success, message: success ? 'Email sent successfully' : 'Failed to send email' });
  } catch (error) {
    console.error('Error in appointment reminder endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Push notification endpoints
router.post('/push/subscribe', async (req, res) => {
  try {
    const { userId, subscription } = req.body;
    
    if (!userId || !subscription) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, subscription' 
      });
    }

    const success = await pushService.saveSubscription(userId, subscription);
    res.json({ success, message: success ? 'Subscription saved successfully' : 'Failed to save subscription' });
  } catch (error) {
    console.error('Error in subscribe endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/push/unsubscribe', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'Missing required field: userId' });
    }

    const success = await pushService.removeSubscription(userId);
    res.json({ success, message: success ? 'Subscription removed successfully' : 'Failed to remove subscription' });
  } catch (error) {
    console.error('Error in unsubscribe endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/push/medication-reminder', async (req, res) => {
  try {
    const { userId, medicationName, dosage, time } = req.body;
    
    if (!userId || !medicationName || !dosage || !time) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, medicationName, dosage, time' 
      });
    }

    const success = await pushService.sendMedicationReminder(
      userId,
      medicationName,
      dosage,
      time
    );

    res.json({ success, message: success ? 'Push notification sent successfully' : 'Failed to send push notification' });
  } catch (error) {
    console.error('Error in push medication reminder endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/push/appointment-reminder', async (req, res) => {
  try {
    const { userId, appointmentDetails } = req.body;
    
    if (!userId || !appointmentDetails) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, appointmentDetails' 
      });
    }

    const success = await pushService.sendAppointmentReminder(
      userId,
      appointmentDetails
    );

    res.json({ success, message: success ? 'Push notification sent successfully' : 'Failed to send push notification' });
  } catch (error) {
    console.error('Error in push appointment reminder endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/push/low-stock-alert', async (req, res) => {
  try {
    const { userId, medicationName, currentStock } = req.body;
    
    if (!userId || !medicationName || currentStock === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, medicationName, currentStock' 
      });
    }

    const success = await pushService.sendLowStockAlert(
      userId,
      medicationName,
      currentStock
    );

    res.json({ success, message: success ? 'Push notification sent successfully' : 'Failed to send push notification' });
  } catch (error) {
    console.error('Error in push low stock alert endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Broadcast endpoint (for admin use)
router.post('/push/broadcast', async (req, res) => {
  try {
    const { title, body, icon, badge, tag, data, actions } = req.body;
    
    if (!title || !body) {
      return res.status(400).json({ 
        error: 'Missing required fields: title, body' 
      });
    }

    const result = await pushService.broadcastToAllUsers({
      title,
      body,
      icon,
      badge,
      tag,
      data,
      actions
    });

    res.json({ 
      success: true, 
      message: `Broadcast completed: ${result.success} success, ${result.failed} failed`,
      result 
    });
  } catch (error) {
    console.error('Error in broadcast endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test endpoint
router.post('/test', async (req, res) => {
  try {
    const { userId, type } = req.body;
    
    if (!userId || !type) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, type' 
      });
    }

    let emailSuccess = false;
    let pushSuccess = false;

    if (type === 'medication') {
      emailSuccess = await emailService.sendMedicationReminder(
        userId,
        'Paracetamol',
        '500mg',
        '08:00 AM'
      );
      pushSuccess = await pushService.sendMedicationReminder(
        userId,
        'Paracetamol',
        '500mg',
        '08:00 AM'
      );
    } else if (type === 'appointment') {
      emailSuccess = await emailService.sendAppointmentReminder(userId, {
        title: 'Consulta Médica',
        date: '2024-01-15',
        time: '10:00 AM',
        doctor: 'Dr. García'
      });
      pushSuccess = await pushService.sendAppointmentReminder(userId, {
        title: 'Consulta Médica',
        date: '2024-01-15',
        time: '10:00 AM',
        doctor: 'Dr. García'
      });
    }

    res.json({ 
      success: true, 
      emailSuccess,
      pushSuccess,
      message: `Test completed - Email: ${emailSuccess ? 'success' : 'failed'}, Push: ${pushSuccess ? 'success' : 'failed'}`
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;