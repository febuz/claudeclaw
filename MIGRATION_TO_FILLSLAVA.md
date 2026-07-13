# Migration Guide: Moving ClaudeClaw to fillslava

This guide explains how to move ClaudeClaw from `febuz/claudeclaw` to `fillslava/claudeclaw` or set it up under the fillslava organization/account.

## Option 1: Transfer Existing Repository (Recommended)

### Prerequisites
- Admin access to `febuz/claudeclaw` repository
- Owner access to `fillslava` organization/account
- GitHub CLI (`gh`) installed

### Steps

1. **Prepare the transfer on GitHub**
   ```bash
   # Login to GitHub CLI if not already
   gh auth login
   
   # Check current repo status
   gh repo view febuz/claudeclaw
   ```

2. **Transfer the repository ownership**
   - Go to: https://github.com/febuz/claudeclaw/settings
   - Scroll to "Danger Zone"
   - Click "Transfer ownership"
   - Enter `fillslava` as the new owner
   - Confirm the transfer

3. **Update local remote**
   ```bash
   cd /home/knight2/claudeclaw
   
   # Change remote URL
   git remote set-url origin git@github.com:fillslava/claudeclaw.git
   
   # Verify the change
   git remote -v
   
   # Push to new location
   git push -u origin master
   ```

## Option 2: Mirror to fillslava Organization

If you want to keep `febuz/claudeclaw` but also host on `fillslava`:

1. **Create new repository under fillslava**
   ```bash
   gh repo create fillslava/claudeclaw --public --clone=false
   ```

2. **Mirror the repository**
   ```bash
   cd /tmp
   git clone --mirror git@github.com:febuz/claudeclaw.git
   cd claudeclaw.git
   git push --mirror git@github.com:fillslava/claudeclaw.git
   cd /home/knight2/claudeclaw
   git remote add fillslava git@github.com:fillslava/claudeclaw.git
   git push fillslava master
   ```

## Option 3: Fresh Clone and Setup

If you want a completely fresh start under fillslava:

1. **Create repository**
   ```bash
   gh repo create fillslava/claudeclaw --public
   ```

2. **Push existing code**
   ```bash
   cd /home/knight2/claudeclaw
   git remote set-url origin git@github.com:fillslava/claudeclaw.git
   git push -u origin master
   ```

## Verification Checklist

After migration:

- [ ] Repository accessible at `https://github.com/fillslava/claudeclaw`
- [ ] All commits and history preserved
- [ ] Local remote points to correct URL
  ```bash
  git remote -v  # Should show fillslava/claudeclaw
  ```
- [ ] Can push and pull successfully
  ```bash
  git pull origin master
  git status
  ```
- [ ] GitHub Pages (if enabled) work correctly
- [ ] Branch protections configured if needed
- [ ] Collaborators/teams added if needed

## Updating Documentation

After successful migration, update these files:

1. **README.md**
   ```markdown
   # Change
   git clone https://github.com/febuz/claudeclaw.git
   
   # To
   git clone https://github.com/fillslava/claudeclaw.git
   ```

2. **GETTING_STARTED.md**
   ```bash
   # Update clone URL
   git clone https://github.com/fillslava/claudeclaw.git
   cd claudeclaw
   ```

3. **package.json** (if needed)
   ```json
   "repository": "fillslava/claudeclaw",
   "homepage": "https://github.com/fillslava/claudeclaw",
   "bugs": "https://github.com/fillslava/claudeclaw/issues"
   ```

## Setting Up GitHub Organization Integration

If `fillslava` is an organization:

1. **Add team access**
   ```bash
   # Settings → Collaborators & teams
   # Add appropriate teams with desired permissions
   ```

2. **Configure branch protection** (optional)
   ```bash
   # Settings → Branches
   # Protect main/master with:
   # - Require pull request reviews
   # - Require status checks
   # - Require branches to be up to date
   ```

3. **Enable GitHub Actions** (optional)
   ```bash
   # Settings → Actions → General
   # Enable Actions for the organization
   ```

## Rollback if Needed

If you need to revert to `febuz/claudeclaw`:

```bash
cd /home/knight2/claudeclaw

# Set remote back to febuz
git remote set-url origin git@github.com:febuz/claudeclaw.git

# Verify
git remote -v

# Push to restore
git push -u origin master
```

## Troubleshooting

### "Permission denied" when pushing
```bash
# Ensure you have SSH key configured
ssh -T git@github.com

# If needed, generate new key
ssh-keygen -t ed25519 -C "your-email@example.com"

# Add to GitHub SSH settings
cat ~/.ssh/id_ed25519.pub
```

### "Repository not found" after transfer
```bash
# Clear cached credentials
git credential-osxkeychain erase
# or
git credential reject <URL>

# Try again
git pull origin master
```

### "Not authorized to transfer"
- Ensure you have admin access to current repo
- Ensure you have owner/admin access to target organization
- Contact repository owner or organization admin

## Next Steps

After successful migration to `fillslava/claudeclaw`:

1. **Update CI/CD workflows** to reference new repository
2. **Update any documentation** pointing to old URL
3. **Configure protected branches** for main development
4. **Add issue and PR templates** under `.github/`
5. **Set up GitHub Pages** with API documentation
6. **Configure branch notifications** for your team

## Additional Resources

- [GitHub Repository Transfer](https://docs.github.com/en/repositories/creating-and-managing-repositories/transferring-a-repository)
- [Managing Repository Access](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings)
- [GitHub Organizations](https://docs.github.com/en/organizations)
