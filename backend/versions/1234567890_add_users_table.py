from alembic import op
import sqlalchemy as sa


# Revision identifiers, used by Alembic.
revision = '1234567890'
down_revision = None  # Set this to the last migration file ID if applicable.
branch_labels = None
depends_on = None


def upgrade():
    # Create a new table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(length=50), nullable=False),
        sa.Column('email', sa.String(length=100), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('username'),
        sa.UniqueConstraint('email')
    )


def downgrade():
    # Drop the table if this migration is rolled back
    op.drop_table('users')
