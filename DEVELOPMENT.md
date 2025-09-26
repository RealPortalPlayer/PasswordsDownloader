# Create your own master

1. Create a git repository
2. Create a README.md file
3. Put the URLs to each part of the database inside it as this: `* [DatabaseName](url)`
4. Upload the master database to a git hosting instance, preferably on a private git hosting instance. Which means not GitHub
5. Update the hard-coded root URL to point to your new URL
6. Obviously, upload database files to those git URLs

## Example

```markdown
* [Intranet](http://10.0.44.20:3000/Passwords/Intranet)
* [Social](http://10.0.44.20:3000/Passwords/Social)
* [Games](http://10.0.44.20:3000/Passwords/Games)
```