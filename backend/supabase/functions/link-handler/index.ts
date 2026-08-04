Deno.serve((req) => {
  const url = new URL(req.url);
  const linkToken = url.searchParams.get("link_token") ?? "";

  const html = `<!DOCTYPE html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <script src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"></script>
    </head>
    <body>
      <script>
        const handler = Plaid.create({
          token: ${JSON.stringify(linkToken)},
          onSuccess: (public_token, metadata) => {
            const inst = metadata.institution ? metadata.institution.name : '';
            window.location.href =
              'expensetracker://success?public_token=' + encodeURIComponent(public_token) +
              '&institution=' + encodeURIComponent(inst);
          },
          onExit: () => { window.location.href = 'expensetracker://exit'; },
        });
        handler.open();
      </script>
    </body>
  </html>`;

  return new Response(html, {headers: {"Content-Type": "text/html"}});
});