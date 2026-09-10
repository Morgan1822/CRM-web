-- ====================================================================
-- 5. INITIAL SEED DATA FOR CRM WEB & FLUTTER MOBILE DEMO
-- ====================================================================

-- 5.1 SEED SAMPLE COMPANIES
INSERT INTO public.companies (id, name, domain, industry, size, phone, website, city, state, country)
VALUES
  ('20000000-0000-0000-0000-000000000001', 'Acme Cloud Dynamics', 'acmecloud.io', 'Cloud Infrastructure', '51-200', '+1 (555) 234-5678', 'https://acmecloud.io', 'San Francisco', 'CA', 'USA'),
  ('20000000-0000-0000-0000-000000000002', 'Starlight FinTech', 'starlightpay.com', 'Financial Technology', '201-1000', '+1 (555) 345-6789', 'https://starlightpay.com', 'New York', 'NY', 'USA'),
  ('20000000-0000-0000-0000-000000000003', 'Apex BioHealth', 'apexbio.health', 'Healthcare AI', '11-50', '+1 (555) 456-7890', 'https://apexbio.health', 'Boston', 'MA', 'USA')
ON CONFLICT (id) DO NOTHING;

-- 5.2 SEED SAMPLE CONTACTS
INSERT INTO public.contacts (id, first_name, last_name, email, phone, company_id, job_title, status, lead_source, notes)
VALUES
  ('30000000-0000-0000-0000-000000000001', 'Sarah', 'Jenkins', 'sarah.jenkins@acmecloud.io', '+1 (555) 123-4567', '20000000-0000-0000-0000-000000000001', 'VP of Engineering', 'qualified', 'website', 'Interested in multi-region failover and dedicated support tier.'),
  ('30000000-0000-0000-0000-000000000002', 'Michael', 'Chang', 'mchang@starlightpay.com', '+1 (555) 987-6543', '20000000-0000-0000-0000-000000000002', 'Chief Product Officer', 'lead', 'inbound_call', 'Met at FinTech Summit 2026. Evaluating API integration throughput.'),
  ('30000000-0000-0000-0000-000000000003', 'Elena', 'Rostova', 'elena@apexbio.health', '+1 (555) 876-5432', '20000000-0000-0000-0000-000000000003', 'Head of Clinical Tech', 'contacted', 'referral', 'Looking for HIPAA compliant CRM sync with native mobile agent app.')
ON CONFLICT (id) DO NOTHING;

-- 5.3 SEED SAMPLE DEALS
INSERT INTO public.deals (id, title, value, currency, stage_id, contact_id, company_id, expected_close_date, notes)
VALUES
  ('40000000-0000-0000-0000-000000000001', 'Enterprise Cloud Migration 2026', 120000.00, 'USD', '10000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', (CURRENT_DATE + INTERVAL '30 days')::date, 'Proposal submitted, security review pending.'),
  ('40000000-0000-0000-0000-000000000002', 'Payment Gateway Integration', 65000.00, 'USD', '10000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', (CURRENT_DATE + INTERVAL '45 days')::date, 'Architecture review meeting scheduled for next Tuesday.'),
  ('40000000-0000-0000-0000-000000000003', 'Healthcare AI Platform License', 240000.00, 'USD', '10000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', (CURRENT_DATE + INTERVAL '15 days')::date, 'Final stage contract redlining with legal counsel.')
ON CONFLICT (id) DO NOTHING;

-- 5.4 SEED SAMPLE TASKS
INSERT INTO public.tasks (id, title, description, type, priority, due_date, is_completed, contact_id, deal_id)
VALUES
  ('50000000-0000-0000-0000-000000000001', 'Follow up on SLA questions with Sarah Jenkins', 'Review SLA uptime guarantees and share disaster recovery documentation.', 'call', 'high', (CURRENT_TIMESTAMP + INTERVAL '1 day'), FALSE, '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001'),
  ('50000000-0000-0000-0000-000000000002', 'Prepare FinTech Integration Deck', 'Customize API latency benchmarks for Michael Chang.', 'todo', 'medium', (CURRENT_TIMESTAMP + INTERVAL '3 days'), FALSE, '30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002'),
  ('50000000-0000-0000-0000-000000000003', 'Legal contract final review with Elena', 'Schedule 30-min call to finalize data protection addendum.', 'meeting', 'urgent', (CURRENT_TIMESTAMP + INTERVAL '2 days'), FALSE, '30000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000003')
ON CONFLICT (id) DO NOTHING;

-- 5.5 SEED SAMPLE CALL LOGS
INSERT INTO public.calls (id, contact_id, deal_id, provider, direction, from_number, to_number, status, duration_seconds, notes, outcome)
VALUES
  ('60000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'twilio', 'outbound', '+1 (555) 000-1111', '+1 (555) 123-4567', 'completed', 342, 'Sarah confirmed budget is approved. Needs proposal sent before Friday.', 'connected_interested'),
  ('60000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', 'twilio', 'outbound', '+1 (555) 000-1111', '+1 (555) 987-6543', 'completed', 180, 'Initial discovery call with Michael. Discussed payment throughput requirements.', 'connected_interested')
ON CONFLICT (id) DO NOTHING;

-- 5.6 SEED SAMPLE ACTIVITIES
INSERT INTO public.activities (id, type, title, description, contact_id, deal_id, company_id)
VALUES
  ('70000000-0000-0000-0000-000000000001', 'call', 'Outbound call with Sarah Jenkins', 'Completed 5m 42s call regarding cloud migration roadmap.', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001'),
  ('70000000-0000-0000-0000-000000000002', 'stage_change', 'Deal moved to Proposal Sent', 'Deal advanced from Meeting Scheduled to Proposal Sent.', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001'),
  ('70000000-0000-0000-0000-000000000003', 'note', 'Technical requirement note', 'Client requires 99.99% SLA and SOC 2 Type II compliance verification.', '30000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003')
ON CONFLICT (id) DO NOTHING;
