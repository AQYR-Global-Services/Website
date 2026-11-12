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
- After the owner resumed browser access, Outlook's original message-details
  dialog was inspected for the 6 November 15:46 Melbourne internal test. It
  confirms SPF, both DKIM signatures, DMARC and composite authentication all
  passed. The aligned From/DKIM domain is `auth.hiremiiglobal.com`; that historical
  message's envelope domain is `rsend.auth.hiremiiglobal.com`. Reply-To correctly
  points to the internal tester's supplied address.
- That message was classified `SCL:5`, `SFV:SPM`, `CAT:SPM`, `BCL:0`, with mailbox
  delivery `dest:J` / `RF:JunkEmail`. This establishes a Microsoft spam-filter
  verdict despite successful authentication. The headers do not identify the
  exact reputation/content feature responsible; do not present either as the
  confirmed cause. It is not evidence of DMARC rejection or a bulk-mail verdict.
- Full internal-test headers are retained privately outside the repository.
  The current DNS check and this older message refer to different return-path
  labels; do not replace working DNS on that basis. No DNS, sender, mailbox rule
  or filtering changes have been made.
- Resend's dashboard independently confirms the same internal test was sent and
  delivered at 15:46 on 6 November, with the expected sender, team recipient and
  Reply-To. Its Insights view lists all checks under Doing Great, without a
  corrective item. The sending domain is currently Verified. These provider-side
  checks do not overturn Microsoft's recipient-side Junk verdict.
- The signed-in Microsoft Defender account can open the false-positive
  submission form. A report for this exact internal test is prepared in scope,
  but sending its contents to Microsoft requires the owner's action-time
  confirmation. No report or allow entry has yet been submitted.

## Next diagnostic steps

1. Report the verified internal-test false positive to Microsoft after the
   owner's confirmation. Use only the exact message and affected team recipient;
   do not submit customer mail. Record Microsoft's result and any recommended
   action. A submission request alone does not prove the verdict is corrected.
2. If needed, compare the corresponding Resend Deliverability Insights and fresh
   message authentication. Keep full headers and identifiers private; only put
   non-sensitive conclusions in Jira.
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
- [Microsoft: diagnose spam verdicts](https://learn.microsoft.com/en-us/defender-office-365/anti-spam-policies-troubleshooting)
- [Microsoft: resolve false positives](https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/step-by-step-guides/how-to-handle-false-positives-in-microsoft-defender-for-office-365?view=o365-worldwide)
