-- ============================================================
-- AMARA ERP/MIS - Migration 010: Enable Supabase Realtime
-- Enable realtime on production-critical tables
-- ============================================================

-- Enable realtime replication for job_cards, qc_logs, and production tables
ALTER PUBLICATION supabase_realtime ADD TABLE job_cards;
ALTER PUBLICATION supabase_realtime ADD TABLE qc_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE production;
