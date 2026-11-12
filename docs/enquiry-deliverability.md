# Website enquiry inbox placement (WEB-3)

## Exact workflow

The public contact form sends through the existing server-side Resend integration:
`AQYR Website <website@auth.hiremiiglobal.com>` to
`info@hiremiiglobal.com`. `Reply-To` is the validated visitor email address.
The separate CRM sender and Barry's personal Inbox do not verify this workflow.
An API success or Resend delivery event means acceptance, not Inbox placement.

## Evidence as of 12 November 2026 (Australia/Melbourne)

- Current code fixes the sender and recipient on the server, validates Reply-To,
  rejects header injection and keeps visitor text as plain text.
- Public DNS returned a DKIM TXT record at
  `resend._domainkey.auth.hiremiiglobal.com` and an SPF TXT record through the
  return-path CNAME `send.auth.hiremiiglobal.com`.
- The organisational `_dmarc.hiremiiglobal.com` TXT record is `p=quarantine`
  with relaxed DKIM/SPF alignment. No separate subdomain DMARC TXT record was
  returned in this check. This does not establish authentication results for
  any particular message.
- Read-only mailbox checks found one 6 November internal website test currently
  in the team's Inbox and another still in Junk. A current folder does not prove
  its initial placement: a user or rule may have moved it.
- The connected Outlook shared-message tools did not return authentication/spam
  headers, including when explicitly selecting `internet_message_headers`.
- Browser inspection was stopped because the runtime could not reliably identify
  the current URL. No DNS, sender, mailbox rule or filtering changes were made.

## Next diagnostic steps

1. In the exact team mailbox, inspect the original internal website-test message
   details. Compare `Authentication-Results` (SPF, DKIM, DMARC, compauth), envelope
   return path, DKIM signing domain and From alignment. Inspect available spam
   classification/SCL and delivery trace. Keep full headers private; only put
   non-sensitive conclusions in Jira.
2. Check the corresponding Resend email's Deliverability Insights and domain
   verification. Distinguish an authentication failure from reputation/content
   classification or a local mailbox rule; do not infer the cause from DNS alone.
3. Make only the narrow change justified by the evidence and authorised scope.
   Do not weaken DMARC, disable filtering, trust a whole domain or replace the
   sender merely to make an old test appear in Inbox.
4. After the approved change, submit a clearly identified internal test through
   the real website with Turnstile enabled. Use no client data. Record the actual
   send time, provider result, original final delivery folder and authentication
   summary. A manually moved old message is not a successful placement test.
5. Keep WEB-3 open until the post-change evidence is verified. Even a successful
   test is evidence of that test, not a guarantee about all future spam filtering.

## Official references

- [Resend: why emails go to spam](https://resend.com/guides/email/deliverability/why-emails-go-to-spam)
- [Resend: deliverability insights](https://resend.com/blog/deliverability-insights)
- [Microsoft: DMARC](https://learn.microsoft.com/en-us/defender-office-365/email-authentication-dmarc-configure)
