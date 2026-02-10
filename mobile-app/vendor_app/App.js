import { StatusBar } from 'expo-status-bar';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
  const uploadDocumentForType = async (documentType, documentCategory) => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: false,
    });
    if (result.canceled) {
      return;
    }
    const file = result.assets?.[0];
    if (!file) {
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('documentCategory', documentCategory);
      formData.append('documentType', documentType);
      formData.append('file', {
        uri: file.uri,
        name: file.name || 'document',
        type: file.mimeType || 'application/octet-stream',
      });

      const response = await fetch(`${API_BASE_URL}/vendors/onboarding/documents/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const text = await response.text();
      let data = null;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = null;
        }
      }

      if (!response.ok) {
        const error = new Error(data?.message || 'Document upload failed');
        error.status = response.status;
        error.data = data;
        throw error;
      }

      await fetchOnboardingStatus();
      setMessage('Document uploaded.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };
  const [sessions, setSessions] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [settlementSummary, setSettlementSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [ticketMessages, setTicketMessages] = useState([]);

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [vendorTypeOpen, setVendorTypeOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [phoneOtpInput, setPhoneOtpInput] = useState('');
  const [emailOtpInput, setEmailOtpInput] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  const [profile, setProfile] = useState({
    vendorType: 'Individual',
    fullName: '',
    businessName: '',
    phone: '',
    email: '',
    addressLine: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
  });


  const [deviceRequest, setDeviceRequest] = useState({
    deviceId: '',
    stationId: '',
    location: '',
    reason: '',
  });

  const [assignmentInput, setAssignmentInput] = useState({
    userId: '',
    deviceId: '',
  });

  const [ticketInput, setTicketInput] = useState({
    subject: '',
    priority: 'NORMAL',
  });

  const [ticketMessageInput, setTicketMessageInput] = useState({
    ticketId: '',
    message: '',
  });

  const isAuthenticated = useMemo(() => Boolean(accessToken), [accessToken]);
  const documentsToShow = useMemo(
    () =>
      profile.vendorType === 'Business'
        ? [...baseDocuments, ...businessDocuments]
        : baseDocuments,
    [profile.vendorType],
  );
  const missingRequiredDocs = useMemo(() => {
    const uploaded = new Set(
      (onboarding?.documents || []).map((doc) => doc.documentType),
    );
    return documentsToShow.filter((doc) => !uploaded.has(doc.documentType));
  }, [documentsToShow, onboarding]);
  const onboardingStatus = onboarding?.profile?.status;
  const onboardingAllowed = ['PENDING_VERIFICATION', 'APPROVED', 'ACTIVE', 'SUSPENDED'];
  const isOnboardingLocked =
    isAuthenticated && onboardingStatus && !onboardingAllowed.includes(onboardingStatus);

  const exchangeOauthCode = async (provider, response, request, exchangeRedirectUri) => {
    if (!response || response.type !== 'success') {
      return;
    }
    const code = response.params?.code;
    if (!code) {
      setMessage('OAuth response missing code.');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const data = await apiRequest(`/vendors/onboarding/oauth/${provider}/exchange`, {
        method: 'POST',
        body: {
          code,
          codeVerifier: request?.codeVerifier,
          redirectUri: exchangeRedirectUri,
        },
      });
      await handleAuthSuccess(data);
      setMessage(`Signed in with ${provider}.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const startOauth = async (provider) => {
    if (provider === 'google') {
      if (!googleClientId) {
        setMessage('Google OAuth is not configured.');
        return;
      }
      await promptGoogle({ useProxy: true });
      return;
    }
    if (provider === 'facebook') {
      if (!facebookClientId) {
        setMessage('Facebook OAuth is not configured.');
        return;
      }
      await promptFacebook({ useProxy });
      return;
    }
    if (provider === 'x') {
      if (!xClientId) {
        setMessage('X OAuth is not configured.');
        return;
      }
      await promptX({ useProxy });
    }
  };

  useEffect(() => {
    const hydrate = async () => {
      const storedAccess = await getAccessToken();
      const storedRefresh = await getRefreshToken();
      const storedVendorId = await getVendorId();
      if (storedAccess) {
        setAccessToken(storedAccess);
      }
      if (storedRefresh) {
        setRefreshToken(storedRefresh);
      }
      if (storedVendorId) {
        setVendorId(storedVendorId);
      }
    };
    hydrate();
  }, []);

  useEffect(() => {
    if (accessToken) {
      fetchOnboardingStatus();
      loadPortalData();
    }
  }, [accessToken]);

  useEffect(() => {
    if (!onboarding?.profile) {
      return;
    }

    const fullName = onboarding.profile.fullName || '';
    const parts = fullName.split(' ').filter(Boolean);
    setFirstName(parts[0] || '');
    setLastName(parts.slice(1).join(' '));
    setProfile((prev) => ({
      ...prev,
      vendorType: onboarding.profile.vendorType || prev.vendorType || 'Individual',
      businessName: onboarding.profile.businessName || '',
      email: onboarding.profile.email || '',
      addressLine: onboarding.profile.addressLine || '',
      city: onboarding.profile.city || '',
      state: onboarding.profile.state || '',
      country: onboarding.profile.country || '',
      pincode: onboarding.profile.pincode || '',
    }));

    const phone = onboarding.profile.phone || '';
    const digits = phone.replace(/^\+91/, '').replace(/\D/g, '');
    setPhoneDigits(digits);
    setPhoneVerified(Boolean(onboarding.profile.phoneVerifiedAt));
    setEmailVerified(Boolean(onboarding.profile.emailVerifiedAt));
  }, [onboarding]);

  useEffect(() => {
    if (isOnboardingLocked) {
      setActiveTab('Onboarding');
    }
  }, [isOnboardingLocked]);

  useEffect(() => {
    exchangeOauthCode('google', googleResponse, googleRequest, googleRedirectUri);
  }, [googleResponse]);

  useEffect(() => {
    exchangeOauthCode('facebook', facebookResponse, facebookRequest, redirectUri);
  }, [facebookResponse]);

  useEffect(() => {
    exchangeOauthCode('x', xResponse, xRequest, redirectUri);
  }, [xResponse]);

  const handleAuthSuccess = async (data) => {
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    setVendorId(data.vendorId);
    await setTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      vendorId: data.vendorId,
    });
  };

  const authorizedRequest = async (path, options = {}) => {
    if (!accessToken) {
      throw new Error('Missing access token');
    }
    try {
      return await apiRequest(path, {
        ...options,
        headers: { ...withAuth(accessToken).headers, ...(options.headers || {}) },
      });
    } catch (error) {
      if (error.status === 401 && refreshToken) {
        const refreshed = await apiRequest('/vendors/onboarding/auth/refresh', {
          method: 'POST',
          body: { refreshToken },
        });
        await handleAuthSuccess(refreshed);
        return apiRequest(path, {
          ...options,
          headers: { ...withAuth(refreshed.accessToken).headers, ...(options.headers || {}) },
        });
      }
      throw error;
    }
  };

  const fetchOnboardingStatus = async () => {
    setLoading(true);
    setMessage('');
    try {
      const data = await authorizedRequest('/vendors/onboarding/status');
      setOnboarding(data);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPortalData = async () => {
    setLoading(true);
    setMessage('');
    try {
      const [
        dash,
        deviceRows,
        userRows,
        assignmentRows,
        sessionRows,
        ledgerRows,
        settlementRows,
        summary,
        alertRows,
        notifRows,
        ticketRows,
      ] = await Promise.all([
        authorizedRequest('/vendors/portal/dashboard'),
        authorizedRequest('/vendors/portal/devices'),
        authorizedRequest('/vendors/portal/users'),
        authorizedRequest('/vendors/portal/users/assignments'),
        authorizedRequest('/vendors/portal/sessions'),
        authorizedRequest('/vendors/portal/transactions'),
        authorizedRequest('/vendors/portal/settlements'),
        authorizedRequest('/vendors/portal/settlements/summary'),
        authorizedRequest('/vendors/portal/alerts'),
        authorizedRequest('/vendors/portal/notifications'),
        authorizedRequest('/vendors/portal/support/tickets'),
      ]);
      setDashboard(dash);
      setDevices(deviceRows);
      setUsers(userRows);
      setAssignments(assignmentRows);
      setSessions(sessionRows);
      setTransactions(ledgerRows);
      setSettlements(settlementRows);
      setSettlementSummary(summary);
      setAlerts(alertRows);
      setNotifications(notifRows);
      setTickets(ticketRows);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const requestOtp = async () => {
    setLoading(true);
    setMessage('');
    try {
      await apiRequest('/vendors/onboarding/otp/request', {
        method: 'POST',
        body: { phone },
      });
      setMessage('OTP sent.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    setMessage('');
    try {
      const data = await apiRequest('/vendors/onboarding/otp/verify', {
        method: 'POST',
        body: { phone, otp },
      });
      await handleAuthSuccess(data);
      setMessage('Logged in with OTP.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const registerEmail = async () => {
    setLoading(true);
    setMessage('');
    try {
      const data = await apiRequest('/vendors/onboarding/email/register', {
        method: 'POST',
        body: { email, password, phone: registerPhone || undefined },
      });
      await handleAuthSuccess(data);
      setMessage('Registered successfully.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loginEmail = async () => {
    setLoading(true);
    setMessage('');
    try {
      const data = await apiRequest('/vendors/onboarding/email/login', {
        method: 'POST',
        body: { email, password },
      });
      await handleAuthSuccess(data);
      setMessage('Logged in with email.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const requestPasswordReset = async () => {
    if (!forgotEmail) {
      setMessage('Enter your email first.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      await apiRequest('/vendors/onboarding/email/reset/request', {
        method: 'POST',
        body: { email: forgotEmail },
      });
      setMessage('OTP sent to your email.');
      setAuthScreen('reset');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmPasswordReset = async () => {
    if (!forgotOtp || !newPassword || !confirmPassword) {
      setMessage('Enter OTP and new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      await apiRequest('/vendors/onboarding/email/reset/confirm', {
        method: 'POST',
        body: { email: forgotEmail, otp: forgotOtp, newPassword },
      });
      setForgotOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage('Password reset successful. Please sign in.');
      setAuthScreen('login');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    if (!trimmedFirst || !trimmedLast) {
      setMessage('Please enter first and last name.');
      return;
    }
    if (profile.vendorType === 'Business' && !profile.businessName.trim()) {
      setMessage('Business name is required for business vendors.');
      return;
    }
    if (phoneDigits.length !== 10) {
      setMessage('Phone number must be 10 digits.');
      return;
    }
    if (!emailPattern.test(profile.email || '')) {
      setMessage('Enter a valid email address.');
      return;
    }
    if (!profile.addressLine.trim()) {
      setMessage('Please enter your address.');
      return;
    }
    if (!profile.city.trim()) {
      setMessage('Please enter your city.');
      return;
    }
    if (!profile.state.trim()) {
      setMessage('Please enter your state.');
      return;
    }
    if (!profile.country.trim()) {
      setMessage('Please enter your country.');
      return;
    }
    if (!profile.pincode.trim()) {
      setMessage('Please enter your pincode.');
      return;
    }
    if (!phoneVerified) {
      setMessage('Please verify your phone number.');
      return;
    }
    if (!emailVerified) {
      setMessage('Please verify your email address.');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const fullName = `${trimmedFirst} ${trimmedLast}`.trim();
      const phoneValue = `+91${phoneDigits}`;
      await authorizedRequest('/vendors/onboarding/profile', {
        method: 'PUT',
        body: {
          ...profile,
          fullName,
          phone: phoneValue,
        },
      });
      await fetchOnboardingStatus();
      setMessage('Profile updated.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const requestPhoneVerification = async () => {
    if (phoneDigits.length !== 10) {
      setMessage('Phone number must be 10 digits.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      await authorizedRequest('/vendors/onboarding/contact/phone/request', {
        method: 'POST',
        body: { phone: `+91${phoneDigits}` },
      });
      setMessage('OTP sent to phone.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyPhoneVerification = async () => {
    if (!phoneOtpInput) {
      setMessage('Enter the phone OTP.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      await authorizedRequest('/vendors/onboarding/contact/phone/verify', {
        method: 'POST',
        body: { phone: `+91${phoneDigits}`, otp: phoneOtpInput },
      });
      setPhoneVerified(true);
      setPhoneOtpInput('');
      setMessage('Phone verified.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const requestEmailVerification = async () => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(profile.email || '')) {
      setMessage('Enter a valid email address.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      await authorizedRequest('/vendors/onboarding/contact/email/request', {
        method: 'POST',
        body: { email: profile.email },
      });
      setMessage('OTP sent to email.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyEmailVerification = async () => {
    if (!emailOtpInput) {
      setMessage('Enter the email OTP.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      await authorizedRequest('/vendors/onboarding/contact/email/verify', {
        method: 'POST',
        body: { email: profile.email, otp: emailOtpInput },
      });
      setEmailVerified(true);
      setEmailOtpInput('');
      setMessage('Email verified.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const uploadDocumentForType = async (documentType, documentCategory) => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: false,
    });
    if (result.canceled) {
      return;
    }
    const file = result.assets?.[0];
    if (!file) {
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('documentCategory', documentCategory);
      formData.append('documentType', documentType);
      formData.append('file', {
        uri: file.uri,
        name: file.name || 'document',
        type: file.mimeType || 'application/octet-stream',
      });

      const response = await fetch(`${API_BASE_URL}/vendors/onboarding/documents/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const text = await response.text();
      let data = null;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = null;
        }
      }

      if (!response.ok) {
        const error = new Error(data?.message || 'Document upload failed');
        error.status = response.status;
        error.data = data;
        throw error;
      }

      await fetchOnboardingStatus();
      setMessage('Document uploaded.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const submitForVerification = async () => {
    if (missingRequiredDocs.length) {
      setMessage('Please upload all required documents before submitting.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      await authorizedRequest('/vendors/onboarding/submit', { method: 'POST' });
      await fetchOnboardingStatus();
      setMessage('Submitted for verification.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const submitDeviceRequest = async () => {
    setLoading(true);
    setMessage('');
    try {
      await authorizedRequest('/vendors/portal/device-requests', {
        method: 'POST',
        body: {
          deviceId: deviceRequest.deviceId || undefined,
          stationId: deviceRequest.stationId || undefined,
          location: deviceRequest.location || undefined,
          reason: deviceRequest.reason,
        },
      });
      setDeviceRequest({ deviceId: '', stationId: '', location: '', reason: '' });
      setMessage('Device request submitted.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleDeviceStatus = async (deviceId, isDisabled) => {
    setLoading(true);
    setMessage('');
    try {
      const path = isDisabled
        ? `/vendors/portal/devices/${deviceId}/enable`
        : `/vendors/portal/devices/${deviceId}/disable`;
      await authorizedRequest(path, { method: 'POST' });
      const rows = await authorizedRequest('/vendors/portal/devices');
      setDevices(rows);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const assignUserToDevice = async () => {
    if (!assignmentInput.userId || !assignmentInput.deviceId) {
      setMessage('Provide both user ID and device ID.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      await authorizedRequest('/vendors/portal/users/assignments', {
        method: 'POST',
        body: assignmentInput,
      });
      const rows = await authorizedRequest('/vendors/portal/users/assignments');
      setAssignments(rows);
      setAssignmentInput({ userId: '', deviceId: '' });
      setMessage('User assigned to device.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const setAssignmentStatus = async (assignmentId, status) => {
    setLoading(true);
    setMessage('');
    try {
      await authorizedRequest(
        `/vendors/portal/users/assignments/${assignmentId}/${status === 'ACTIVE' ? 'enable' : 'disable'}`,
        { method: 'POST' },
      );
      const rows = await authorizedRequest('/vendors/portal/users/assignments');
      setAssignments(rows);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async () => {
    setLoading(true);
    setMessage('');
    try {
      await authorizedRequest('/vendors/portal/support/tickets', {
        method: 'POST',
        body: ticketInput,
      });
      setTicketInput({ subject: '', priority: 'NORMAL' });
      const rows = await authorizedRequest('/vendors/portal/support/tickets');
      setTickets(rows);
      setMessage('Support ticket created.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTicketMessages = async () => {
    if (!ticketMessageInput.ticketId) {
      setMessage('Enter a ticket ID.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const rows = await authorizedRequest(
        `/vendors/portal/support/tickets/${ticketMessageInput.ticketId}/messages`,
      );
      setTicketMessages(rows);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const addTicketMessage = async () => {
    if (!ticketMessageInput.ticketId) {
      setMessage('Enter a ticket ID.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      await authorizedRequest(
        `/vendors/portal/support/tickets/${ticketMessageInput.ticketId}/messages`,
        {
          method: 'POST',
          body: { message: ticketMessageInput.message },
        },
      );
      setTicketMessageInput({ ...ticketMessageInput, message: '' });
      await loadTicketMessages();
      setMessage('Message sent.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const markNotificationRead = async (id) => {
    setLoading(true);
    setMessage('');
    try {
      await authorizedRequest(`/vendors/portal/notifications/${id}/read`, { method: 'POST' });
      const rows = await authorizedRequest('/vendors/portal/notifications');
      setNotifications(rows);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await clearTokens();
    setAccessToken(null);
    setRefreshToken(null);
    setVendorId(null);
    setOnboarding(null);
    setAuthScreen('login');
    setMessage('Logged out.');
  };

  const renderTab = () => {
    if (activeTab === 'Dashboard') {
      return (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dashboard</Text>
          <View style={styles.statGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{dashboard?.totalDevices ?? 0}</Text>
              <Text style={styles.statLabel}>Total Devices</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{dashboard?.activeDevices ?? 0}</Text>
              <Text style={styles.statLabel}>Active Devices</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{dashboard?.assignedUsers ?? 0}</Text>
              <Text style={styles.statLabel}>Assigned Users</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>₹{dashboard?.todayRevenue ?? 0}</Text>
              <Text style={styles.statLabel}>Today Revenue</Text>
            </View>
            <View style={styles.statCardWide}>
              <Text style={styles.statValue}>₹{dashboard?.monthlyRevenue ?? 0}</Text>
              <Text style={styles.statLabel}>Monthly Revenue</Text>
            </View>
            <View style={styles.statCardWide}>
              <Text style={styles.statValue}>{dashboard?.deviceAlerts ?? 0}</Text>
              <Text style={styles.statLabel}>Open Device Alerts</Text>
            </View>
          </View>
        </View>
      );
    }

    if (activeTab === 'Devices') {
      return (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Devices</Text>
          {devices.length ? (
            devices.map((device) => {
              const isDisabled = String(device.status).toLowerCase() === 'disabled';
              return (
                <View key={device.id} style={styles.listRow}>
                  <View>
                    <Text style={styles.listTitle}>{device.id}</Text>
                    <Text style={styles.listMeta}>{device.status}</Text>
                  </View>
                  <TouchableOpacity
                    style={isDisabled ? styles.badgePrimary : styles.badgeMuted}
                    onPress={() => toggleDeviceStatus(device.id, isDisabled)}
                  >
                    <Text style={styles.badgeText}>{isDisabled ? 'Enable' : 'Disable'}</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          ) : (
            <Text style={styles.empty}>No devices assigned.</Text>
          )}

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Request New Device</Text>
          <TextInput
            style={styles.input}
            placeholder="Device ID (optional)"
            value={deviceRequest.deviceId}
            onChangeText={(value) => setDeviceRequest({ ...deviceRequest, deviceId: value })}
          />
          <TextInput
            style={styles.input}
            placeholder="Station ID (optional)"
            value={deviceRequest.stationId}
            onChangeText={(value) => setDeviceRequest({ ...deviceRequest, stationId: value })}
          />
          <TextInput
            style={styles.input}
            placeholder="Location"
            value={deviceRequest.location}
            onChangeText={(value) => setDeviceRequest({ ...deviceRequest, location: value })}
          />
          <TextInput
            style={styles.input}
            placeholder="Reason"
            value={deviceRequest.reason}
            onChangeText={(value) => setDeviceRequest({ ...deviceRequest, reason: value })}
          />
          <TouchableOpacity style={styles.buttonPrimary} onPress={submitDeviceRequest}>
            <Text style={styles.buttonText}>Submit Request</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (activeTab === 'Users') {
      return (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Users</Text>
          {users.length ? (
            users.map((user) => (
              <View key={user.id} style={styles.listRow}>
                <View>
                  <Text style={styles.listTitle}>{user.name || 'Unnamed User'}</Text>
                  <Text style={styles.listMeta}>{user.phone}</Text>
                </View>
                <Text style={styles.listMeta}>{user.totalSessions} sessions</Text>
              </View>
            ))
          ) : (
            <Text style={styles.empty}>No users yet.</Text>
          )}

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Assign User to Device</Text>
          <TextInput
            style={styles.input}
            placeholder="User ID"
            value={assignmentInput.userId}
            onChangeText={(value) => setAssignmentInput({ ...assignmentInput, userId: value })}
          />
          <TextInput
            style={styles.input}
            placeholder="Device ID"
            value={assignmentInput.deviceId}
            onChangeText={(value) => setAssignmentInput({ ...assignmentInput, deviceId: value })}
          />
          <TouchableOpacity style={styles.buttonPrimary} onPress={assignUserToDevice}>
            <Text style={styles.buttonText}>Assign</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Assignments</Text>
          {assignments.length ? (
            assignments.map((row) => (
              <View key={row.id} style={styles.listRow}>
                <View>
                  <Text style={styles.listTitle}>{row.userName || row.userPhone || row.userId}</Text>
                  <Text style={styles.listMeta}>Device: {row.deviceId}</Text>
                </View>
                <TouchableOpacity
                  style={row.status === 'ACTIVE' ? styles.badgeMuted : styles.badgePrimary}
                  onPress={() =>
                    setAssignmentStatus(row.id, row.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE')
                  }
                >
                  <Text style={styles.badgeText}>{row.status === 'ACTIVE' ? 'Disable' : 'Enable'}</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.empty}>No assignments yet.</Text>
          )}
        </View>
      );
    }

    if (activeTab === 'Sessions') {
      return (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sessions</Text>
          {sessions.length ? (
            sessions.map((session) => (
              <View key={session.id} style={styles.listRow}>
                <View>
                  <Text style={styles.listTitle}>{session.deviceId}</Text>
                  <Text style={styles.listMeta}>User: {session.userId}</Text>
                  <Text style={styles.listMeta}>Status: {session.status}</Text>
                </View>
                <Text style={styles.listAmount}>₹{session.vendorAmount}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.empty}>No sessions yet.</Text>
          )}
        </View>
      );
    }

    if (activeTab === 'Earnings') {
      return (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Earnings</Text>
          <View style={styles.statGrid}>
            <View style={styles.statCardWide}>
              <Text style={styles.statValue}>₹{settlementSummary?.total ?? 0}</Text>
              <Text style={styles.statLabel}>Total Settlements</Text>
            </View>
            <View style={styles.statCardWide}>
              <Text style={styles.statValue}>₹{settlementSummary?.paid ?? 0}</Text>
              <Text style={styles.statLabel}>Paid</Text>
            </View>
            <View style={styles.statCardWide}>
              <Text style={styles.statValue}>₹{settlementSummary?.pending ?? 0}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Settlement History</Text>
          {settlements.length ? (
            settlements.map((row) => (
              <View key={row.id} style={styles.listRow}>
                <View>
                  <Text style={styles.listTitle}>{row.status}</Text>
                  <Text style={styles.listMeta}>Amount: ₹{row.amount}</Text>
                </View>
                <Text style={styles.listMeta}>{row.createdAt?.slice?.(0, 10) ?? ''}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.empty}>No settlement entries yet.</Text>
          )}

          <Text style={styles.sectionTitle}>Transactions</Text>
          {transactions.length ? (
            transactions.map((row) => (
              <View key={row.id} style={styles.listRow}>
                <View>
                  <Text style={styles.listTitle}>{row.deviceId || 'Session'}</Text>
                  <Text style={styles.listMeta}>User: {row.userId || '-'}</Text>
                </View>
                <Text style={styles.listAmount}>₹{row.amount}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.empty}>No transactions yet.</Text>
          )}
        </View>
      );
    }

    if (activeTab === 'Alerts') {
      return (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Device Alerts</Text>
          {alerts.length ? (
            alerts.map((alert) => (
              <View key={alert.id} style={styles.listRow}>
                <View>
                  <Text style={styles.listTitle}>{alert.type}</Text>
                  <Text style={styles.listMeta}>Device: {alert.deviceId}</Text>
                </View>
                <Text style={styles.listMeta}>{alert.status}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.empty}>No alerts.</Text>
          )}
        </View>
      );
    }

    if (activeTab === 'Notifications') {
      return (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notifications</Text>
          {notifications.length ? (
            notifications.map((note) => (
              <View key={note.id} style={styles.notificationRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listTitle}>{note.title}</Text>
                  <Text style={styles.listMeta}>{note.body}</Text>
                </View>
                <TouchableOpacity
                  style={note.status === 'READ' ? styles.badgeMuted : styles.badgePrimary}
                  onPress={() => markNotificationRead(note.id)}
                >
                  <Text style={styles.badgeText}>{note.status}</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.empty}>No notifications yet.</Text>
          )}
        </View>
      );
    }

    if (activeTab === 'Support') {
      return (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Support Tickets</Text>
          {tickets.length ? (
            tickets.map((ticket) => (
              <View key={ticket.id} style={styles.listRow}>
                <View>
                  <Text style={styles.listTitle}>{ticket.subject}</Text>
                  <Text style={styles.listMeta}>{ticket.status}</Text>
                </View>
                <Text style={styles.listMeta}>{ticket.priority}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.empty}>No tickets yet.</Text>
          )}

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Create Ticket</Text>
          <TextInput
            style={styles.input}
            placeholder="Subject"
            value={ticketInput.subject}
            onChangeText={(value) => setTicketInput({ ...ticketInput, subject: value })}
          />
          <TextInput
            style={styles.input}
            placeholder="Priority (LOW | NORMAL | HIGH)"
            value={ticketInput.priority}
            onChangeText={(value) => setTicketInput({ ...ticketInput, priority: value })}
          />
          <TouchableOpacity style={styles.buttonPrimary} onPress={createTicket}>
            <Text style={styles.buttonText}>Create Ticket</Text>
          </TouchableOpacity>

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Ticket Messages</Text>
          <TextInput
            style={styles.input}
            placeholder="Ticket ID"
            value={ticketMessageInput.ticketId}
            onChangeText={(value) =>
              setTicketMessageInput({ ...ticketMessageInput, ticketId: value })
            }
          />
          <TextInput
            style={styles.input}
            placeholder="Message"
            value={ticketMessageInput.message}
            onChangeText={(value) =>
              setTicketMessageInput({ ...ticketMessageInput, message: value })
            }
          />
          <View style={styles.row}>
            <TouchableOpacity style={styles.buttonSecondary} onPress={loadTicketMessages}>
              <Text style={styles.buttonText}>Load</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonPrimary} onPress={addTicketMessage}>
              <Text style={styles.buttonText}>Send</Text>
            </TouchableOpacity>
          </View>
          {ticketMessages.length ? (
            ticketMessages.map((msg) => (
              <View key={msg.id} style={styles.messageBubble}>
                <Text style={styles.messageSender}>{msg.senderRole}</Text>
                <Text style={styles.messageText}>{msg.message}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.empty}>No messages loaded.</Text>
          )}
        </View>
      );
    }

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Onboarding</Text>
        <Text style={styles.label}>Vendor ID: {vendorId || '-'}</Text>
        <Text style={styles.label}>Status: {onboarding?.profile?.status || '-'}</Text>
        <Text style={styles.label}>KYC: {onboarding?.profile?.kyc || '-'}</Text>
        <TouchableOpacity style={styles.buttonSecondary} onPress={fetchOnboardingStatus}>
          <Text style={styles.buttonText}>Refresh Status</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonGhost} onPress={logout}>
          <Text style={styles.buttonGhostText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Profile</Text>
        <Text style={styles.label}>Vendor Type</Text>
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setVendorTypeOpen((prev) => !prev)}
        >
          <Text style={styles.dropdownText}>{profile.vendorType || 'Select type'}</Text>
        </TouchableOpacity>
        {vendorTypeOpen ? (
          <View style={styles.dropdownList}>
            {['Individual', 'Business', 'Others'].map((type) => (
              <TouchableOpacity
                key={type}
                style={styles.dropdownItem}
                onPress={() => {
                  setProfile({ ...profile, vendorType: type });
                  setVendorTypeOpen(false);
                }}
              >
                <Text style={styles.dropdownItemText}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <TextInput
          style={styles.input}
          placeholder="First Name"
          value={firstName}
          onChangeText={setFirstName}
        />
        <TextInput
          style={styles.input}
          placeholder="Last Name"
          value={lastName}
          onChangeText={setLastName}
        />
        {profile.vendorType === 'Business' ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Business Name"
              value={profile.businessName}
              onChangeText={(value) => setProfile({ ...profile, businessName: value })}
            />
            <Text style={styles.hint}>Business documents are mandatory for verification.</Text>
          </>
        ) : null}

        <View style={styles.labelRow}>
          <Text style={styles.label}>Phone Number</Text>
          {phoneVerified ? (
            <View style={styles.badgeSmall}>
              <Text style={styles.badgeSmallText}>Verified</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.inlineRow}>
          <View style={styles.prefixBox}>
            <Text style={styles.prefixText}>+91</Text>
          </View>
          <TextInput
            style={styles.inlineInput}
            placeholder="10-digit number"
            value={phoneDigits}
            onChangeText={(value) => {
              const digits = value.replace(/\D/g, '').slice(0, 10);
              setPhoneDigits(digits);
              setPhoneVerified(false);
            }}
            keyboardType="number-pad"
          />
          <TouchableOpacity
            style={[styles.inlineButton, phoneVerified && styles.inlineButtonDisabled]}
            onPress={requestPhoneVerification}
            disabled={phoneVerified}
          >
            <Text style={styles.inlineButtonText}>Send OTP</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.inlineRow}>
          <TextInput
            style={styles.inlineInput}
            placeholder="Phone OTP"
            value={phoneOtpInput}
            onChangeText={setPhoneOtpInput}
            keyboardType="number-pad"
          />
          <TouchableOpacity
            style={[styles.inlineButton, phoneVerified && styles.inlineButtonDisabled]}
            onPress={verifyPhoneVerification}
            disabled={phoneVerified}
          >
            <Text style={styles.inlineButtonText}>
              {phoneVerified ? 'Verified' : 'Verify'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.labelRow}>
          <Text style={styles.label}>Email</Text>
          {emailVerified ? (
            <View style={styles.badgeSmall}>
              <Text style={styles.badgeSmallText}>Verified</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.inlineRow}>
          <TextInput
            style={styles.inlineInput}
            placeholder="Email"
            value={profile.email}
            onChangeText={(value) => {
              setProfile({ ...profile, email: value });
              setEmailVerified(false);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={[styles.inlineButton, emailVerified && styles.inlineButtonDisabled]}
            onPress={requestEmailVerification}
            disabled={emailVerified}
          >
            <Text style={styles.inlineButtonText}>Send OTP</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.inlineRow}>
          <TextInput
            style={styles.inlineInput}
            placeholder="Email OTP"
            value={emailOtpInput}
            onChangeText={setEmailOtpInput}
            keyboardType="number-pad"
          />
          <TouchableOpacity
            style={[styles.inlineButton, emailVerified && styles.inlineButtonDisabled]}
            onPress={verifyEmailVerification}
            disabled={emailVerified}
          >
            <Text style={styles.inlineButtonText}>
              {emailVerified ? 'Verified' : 'Verify'}
            </Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Address"
          value={profile.addressLine}
          onChangeText={(value) => setProfile({ ...profile, addressLine: value })}
        />
        <TextInput
          style={styles.input}
          placeholder="City"
          value={profile.city}
          onChangeText={(value) => setProfile({ ...profile, city: value })}
        />
        <TextInput
          style={styles.input}
          placeholder="State"
          value={profile.state}
          onChangeText={(value) => setProfile({ ...profile, state: value })}
        />
        <TextInput
          style={styles.input}
          placeholder="Country"
          value={profile.country}
          onChangeText={(value) => setProfile({ ...profile, country: value })}
        />
        <TextInput
          style={styles.input}
          placeholder="Pincode"
          value={profile.pincode}
          onChangeText={(value) => setProfile({ ...profile, pincode: value })}
        />
        <TouchableOpacity style={styles.buttonPrimary} onPress={updateProfile}>
          <Text style={styles.buttonText}>Save Profile</Text>
        </TouchableOpacity>

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Documents</Text>
        {documentsToShow.map((doc) => {
          const isUploaded = onboarding?.documents?.some(
            (uploaded) => uploaded.documentType === doc.documentType,
          );
          return (
            <View key={doc.documentType} style={styles.docBlock}>
              <View style={styles.docLabelRow}>
                <Text style={styles.docLabel}>{doc.label}</Text>
                <View style={styles.docRequiredBadge}>
                  <Text style={styles.docRequiredText}>Required</Text>
                </View>
              </View>
              <View style={styles.docActionRow}>
                <TouchableOpacity
                  style={styles.docUploadButton}
                  onPress={() => uploadDocumentForType(doc.documentType, doc.documentCategory)}
                >
                  <Text style={styles.docUploadText}>Upload Document</Text>
                </TouchableOpacity>
                {isUploaded ? (
                  <Text style={styles.docUploaded}>Document uploaded</Text>
                ) : null}
              </View>
            </View>
          );
        })}

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Submit for Verification</Text>
        <Text style={styles.hint}>
          Submit only after mandatory identity, property, finance, and legal documents are uploaded.
        </Text>
        {missingRequiredDocs.length ? (
          <Text style={styles.hint}>
            Missing: {missingRequiredDocs.map((doc) => doc.label).join(', ')}
          </Text>
        ) : null}
        <TouchableOpacity
          style={[styles.buttonPrimary, missingRequiredDocs.length && styles.buttonDisabled]}
          onPress={submitForVerification}
          disabled={Boolean(missingRequiredDocs.length)}
        >
          <Text style={styles.buttonText}>Submit for Verification</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scroll}>
        {isAuthenticated ? (
          <>
            <Text style={styles.title}>Vendor Portal</Text>
            <Text style={styles.subTitle}>API: {API_BASE_URL}</Text>
          </>
        ) : null}

        {isOnboardingLocked ? (
          <Text style={styles.message}>
            Complete onboarding to unlock the dashboard and device management.
          </Text>
        ) : null}

        {message ? <Text style={styles.message}>{message}</Text> : null}

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#1f3a5f" />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        )}

        {!isAuthenticated ? (
          <View style={styles.authShell}>
            <View style={styles.authHero}>
              <View style={styles.authHeroBase} />
              <View style={styles.authHeroTilt} />
              <View style={styles.authHeroContent}>
                <Text style={styles.authHeroTitle}>
                  {authScreen === 'register' ? 'Sign up' : 'Login'}
                </Text>
                <Text style={styles.authHeroSubtitle}>
                  {authScreen === 'register'
                    ? 'Create your vendor account using email or phone.'
                    : 'Sign in to continue.'}
                </Text>
                <Text style={styles.authMeta}>API: {API_BASE_URL}</Text>
              </View>
            </View>

            <View style={styles.authCard}>
              {authScreen === 'login' ? (
                <>
                  <Text style={styles.authLabel}>Username</Text>
                  <TextInput
                    style={styles.authInput}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <Text style={styles.authLabel}>Password</Text>
                  <TextInput
                    style={styles.authInput}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                  <TouchableOpacity
                    style={styles.authButtonSecondary}
                    onPress={() => {
                      setEmail('test@test.com');
                      setPassword('Test@123');
                    }}
                  >
                    <Text style={styles.authButtonSecondaryText}>Use Test Login</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.authButtonPrimary} onPress={loginEmail}>
                    <Text style={styles.authButtonText}>Sign in</Text>
                  </TouchableOpacity>
                  <View style={styles.authDivider}>
                    <View style={styles.authDividerLine} />
                    <Text style={styles.authDividerText}>or</Text>
                    <View style={styles.authDividerLine} />
                  </View>
                  <View style={styles.authSocialRow}>
                    <TouchableOpacity
                      style={[styles.authSocialButton, styles.authSocialGoogle]}
                      onPress={() => startOauth('google')}
                    >
                      <Text style={styles.authSocialText}>Google</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.authSocialButton, styles.authSocialFacebook]}
                      onPress={() => startOauth('facebook')}
                    >
                      <Text style={styles.authSocialText}>Facebook</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.authSocialButton, styles.authSocialX]}
                      onPress={() => startOauth('x')}
                    >
                      <Text style={styles.authSocialText}>X</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={styles.authLink} onPress={() => setAuthScreen('otp')}>
                    <Text style={styles.authLinkText}>Login with phone OTP</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.authLink} onPress={() => setAuthScreen('forgot')}>
                    <Text style={styles.authLinkText}>Forgot password?</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.authLink} onPress={() => setAuthScreen('register')}>
                    <Text style={styles.authLinkText}>New user? Sign up with email or phone</Text>
                  </TouchableOpacity>
                </>
              ) : null}

              {authScreen === 'forgot' ? (
                <>
                  <TouchableOpacity style={styles.authBack} onPress={() => setAuthScreen('login')}>
                    <Text style={styles.authBackText}>Back</Text>
                  </TouchableOpacity>
                  <Text style={styles.authLabel}>Email</Text>
                  <TextInput
                    style={styles.authInput}
                    placeholder="Email"
                    value={forgotEmail}
                    onChangeText={setForgotEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <TouchableOpacity style={styles.authButtonPrimary} onPress={requestPasswordReset}>
                    <Text style={styles.authButtonText}>Send OTP</Text>
                  </TouchableOpacity>
                </>
              ) : null}

              {authScreen === 'register' ? (
                <>
                  <TouchableOpacity
                    style={styles.authBack}
                    onPress={() => setAuthScreen('login')}
                  >
                    <Text style={styles.authBackText}>Back</Text>
                  </TouchableOpacity>
                  <Text style={styles.authLabel}>Email</Text>
                  <TextInput
                    style={styles.authInput}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <Text style={styles.authLabel}>Password</Text>
                  <TextInput
                    style={styles.authInput}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                  <Text style={styles.authLabel}>Phone (optional)</Text>
                  <TextInput
                    style={styles.authInput}
                    placeholder="Phone"
                    value={registerPhone}
                    onChangeText={setRegisterPhone}
                    keyboardType="phone-pad"
                  />
                  <TouchableOpacity style={styles.authButtonPrimary} onPress={registerEmail}>
                    <Text style={styles.authButtonText}>Sign up</Text>
                  </TouchableOpacity>
                </>
              ) : null}

              {authScreen === 'otp' ? (
                <>
                  <TouchableOpacity
                    style={styles.authBack}
                    onPress={() => setAuthScreen('login')}
                  >
                    <Text style={styles.authBackText}>Back</Text>
                  </TouchableOpacity>
                  <Text style={styles.authLabel}>Phone</Text>
                  <TextInput
                    style={styles.authInput}
                    placeholder="Phone"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                  <Text style={styles.authLabel}>OTP</Text>
                  <TextInput
                    style={styles.authInput}
                    placeholder="OTP"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                  />
                  <View style={styles.row}>
                    <TouchableOpacity style={styles.authButtonSecondary} onPress={requestOtp}>
                      <Text style={styles.authButtonSecondaryText}>Request OTP</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.authButtonPrimary} onPress={verifyOtp}>
                      <Text style={styles.authButtonText}>Verify</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : null}

              {authScreen === 'reset' ? (
                <>
                  <TouchableOpacity style={styles.authBack} onPress={() => setAuthScreen('forgot')}>
                    <Text style={styles.authBackText}>Back</Text>
                  </TouchableOpacity>
                  <Text style={styles.authLabel}>Email OTP</Text>
                  <TextInput
                    style={styles.authInput}
                    placeholder="OTP"
                    value={forgotOtp}
                    onChangeText={setForgotOtp}
                    keyboardType="number-pad"
                  />
                  <Text style={styles.authLabel}>New Password</Text>
                  <TextInput
                    style={styles.authInput}
                    placeholder="New Password"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                  />
                  <Text style={styles.authLabel}>Confirm Password</Text>
                  <TextInput
                    style={styles.authInput}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                  />
                  <TouchableOpacity style={styles.authButtonPrimary} onPress={confirmPasswordReset}>
                    <Text style={styles.authButtonText}>Reset Password</Text>
                  </TouchableOpacity>
                </>
              ) : null}
            </View>
          </View>
        ) : isOnboardingLocked ? (
          renderTab()
        ) : (
          <>
            <View style={styles.tabRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {tabs.map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    style={tab === activeTab ? styles.tabActive : styles.tab}
                    onPress={() => setActiveTab(tab)}
                  >
                    <Text style={tab === activeTab ? styles.tabTextActive : styles.tabText}>
                      {tab}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            {renderTab()}
            <TouchableOpacity style={styles.buttonGhost} onPress={loadPortalData}>
              <Text style={styles.buttonGhostText}>Refresh Data</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },
  scroll: {
    padding: 20,
    paddingBottom: 48,
  },
  authShell: {
    paddingTop: 10,
  },
  authHero: {
    height: 220,
    borderRadius: 18,
    backgroundColor: '#c9d7ad',
    overflow: 'hidden',
    marginBottom: 18,
  },
  authHeroBase: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
    backgroundColor: '#2f5a32',
  },
  authHeroTilt: {
    position: 'absolute',
    top: 80,
    left: -60,
    right: -60,
    height: 160,
    backgroundColor: '#557a3a',
    transform: [{ rotate: '-6deg' }],
  },
  authHeroContent: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 18,
    paddingBottom: 24,
  },
  authHeroTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#10210f',
  },
  authHeroSubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#243423',
  },
  authMeta: {
    marginTop: 10,
    fontSize: 11,
    color: '#31422f',
  },
  authCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#0f1c2e',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  authLabel: {
    fontSize: 13,
    color: '#2f3c2a',
    marginBottom: 6,
  },
  authInput: {
    borderWidth: 1,
    borderColor: '#bcc9a7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    backgroundColor: '#e6eed2',
  },
  authButtonPrimary: {
    backgroundColor: '#2f4f2e',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 10,
    flex: 1,
  },
  authButtonSecondary: {
    backgroundColor: '#c9d7ad',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 10,
    flex: 1,
  },
  authButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  authButtonSecondaryText: {
    color: '#2f4f2e',
    fontWeight: '700',
    fontSize: 15,
  },
  authDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  authDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#c4d2ae',
  },
  authDividerText: {
    marginHorizontal: 8,
    color: '#4a5b40',
    fontSize: 12,
    fontWeight: '600',
  },
  authSocialRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  authSocialButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  authSocialText: {
    color: '#10210f',
    fontWeight: '700',
    fontSize: 13,
  },
  authSocialGoogle: {
    backgroundColor: '#f1f4e8',
    borderWidth: 1,
    borderColor: '#cdd8bd',
  },
  authSocialFacebook: {
    backgroundColor: '#e5edff',
    borderWidth: 1,
    borderColor: '#c4d1f7',
  },
  authSocialX: {
    backgroundColor: '#e3e8ea',
    borderWidth: 1,
    borderColor: '#c5ced1',
  },
  authLink: {
    alignItems: 'center',
    marginTop: 6,
  },
  authLinkText: {
    color: '#2f4f2e',
    fontWeight: '700',
  },
  authBack: {
    marginBottom: 10,
  },
  authBackText: {
    color: '#2f4f2e',
    fontWeight: '700',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f3a5f',
    marginBottom: 4,
  },
  subTitle: {
    color: '#4f5d75',
    marginBottom: 16,
  },
  message: {
    backgroundColor: '#e1ecf9',
    color: '#1f3a5f',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  loadingText: {
    marginLeft: 8,
    color: '#1f3a5f',
  },
  tabRow: {
    marginBottom: 12,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#e9eff6',
    borderRadius: 20,
    marginRight: 8,
  },
  tabActive: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#1f3a5f',
    borderRadius: 20,
    marginRight: 8,
  },
  tabText: {
    color: '#1f3a5f',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0f1c2e',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f3a5f',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f3a5f',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d9e2ec',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    backgroundColor: '#f8fafc',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buttonPrimary: {
    backgroundColor: '#1f3a5f',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    alignItems: 'center',
    flex: 1,
  },
  buttonDisabled: {
    backgroundColor: '#93a1b1',
  },
  buttonSecondary: {
    backgroundColor: '#3e5c76',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  buttonGhost: {
    borderWidth: 1,
    borderColor: '#1f3a5f',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonGhostText: {
    color: '#1f3a5f',
    fontWeight: '600',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#edf2f7',
    marginVertical: 16,
  },
  label: {
    color: '#4f5d75',
    marginBottom: 6,
  },
  hint: {
    color: '#6b7c93',
    marginBottom: 8,
  },
  docBlock: {
    marginBottom: 12,
  },
  docLabel: {
    color: '#1f3a5f',
    fontWeight: '600',
    marginBottom: 6,
  },
  docLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  docRequiredBadge: {
    backgroundColor: '#fde2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  docRequiredText: {
    color: '#9b2226',
    fontSize: 11,
    fontWeight: '700',
  },
  docActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  docUploadButton: {
    backgroundColor: '#3e5c76',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  docUploadText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  docUploaded: {
    color: '#2d6a4f',
    fontWeight: '700',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  badgeSmall: {
    backgroundColor: '#d8f3dc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeSmallText: {
    color: '#2d6a4f',
    fontSize: 11,
    fontWeight: '700',
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#d9e2ec',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
    backgroundColor: '#f8fafc',
  },
  dropdownText: {
    color: '#1f3a5f',
    fontWeight: '600',
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: '#d9e2ec',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    marginBottom: 10,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#edf2f7',
  },
  dropdownItemText: {
    color: '#1f3a5f',
    fontWeight: '600',
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  prefixBox: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#d9e2ec',
    borderRadius: 10,
    backgroundColor: '#f0f4fa',
  },
  prefixText: {
    color: '#1f3a5f',
    fontWeight: '600',
  },
  inlineInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d9e2ec',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
  },
  inlineButton: {
    backgroundColor: '#1f3a5f',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  inlineButtonDisabled: {
    backgroundColor: '#93a1b1',
  },
  inlineButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 12,
  },
  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  listTitle: {
    color: '#1f3a5f',
    fontWeight: '600',
  },
  listMeta: {
    color: '#4f5d75',
  },
  listAmount: {
    color: '#1f3a5f',
    fontWeight: '700',
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  badgePrimary: {
    backgroundColor: '#1f3a5f',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeMuted: {
    backgroundColor: '#cbd6e2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '47%',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f0f4fa',
  },
  statCardWide: {
    width: '100%',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f0f4fa',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f3a5f',
    marginBottom: 4,
  },
  statLabel: {
    color: '#4f5d75',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f0f4fa',
    marginBottom: 8,
  },
  messageSender: {
    fontSize: 12,
    color: '#6b7c93',
    marginBottom: 4,
  },
  messageText: {
    color: '#1f3a5f',
  },
  docRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  docType: {
    color: '#1f3a5f',
    fontWeight: '600',
  },
  docStatus: {
    color: '#4f5d75',
  },
  empty: {
    color: '#6b7c93',
  },
});
